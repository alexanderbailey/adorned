-- ============================================================
-- Billing — subscriptions, top-ups, and metered AI usage
-- ============================================================
-- Two tables, all mutations via SECURITY DEFINER RPCs so RLS can stay strict.
--
-- Plan numbers (initial grants, monthly drips, daily caps, prices) live in
-- code at src/lib/billing/plans.ts. RPCs that depend on those numbers accept
-- them as parameters so the app can evolve plans without DB migrations.
--
-- Renewal of subscriptions (refill on period_end) is driven from the app via
-- /api/cron/advance-cycles. Wire that endpoint to Vercel Cron, or enable
-- pg_cron in Supabase and schedule a job that hits the endpoint hourly:
--
--   select cron.schedule(
--     'advance-billing-cycles', '0 * * * *',
--     $$select net.http_post('https://<host>/api/cron/advance-cycles',
--       headers => jsonb_build_object('x-cron-secret', current_setting('app.cron_secret')))$$
--   );
-- ============================================================

create type subscription_tier as enum ('standard', 'pro');
create type subscription_status as enum ('active', 'cancelled', 'past_due');
create type topup_resource as enum ('tryon', 'wardrobe_add');

create table user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier subscription_tier not null,
  status subscription_status not null default 'active',

  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancel_at_period_end bool not null default false,
  pending_tier_change subscription_tier,

  -- Subscription-bucket credits. Try-ons reset on renewal; wardrobe drips
  -- accumulate. Both zero on cancellation period-end.
  sub_tryon_credits int not null default 0,
  sub_wardrobe_credits int not null default 0,

  -- Hidden daily outfit-generation counter. Reset lazily inside the RPC
  -- when daily_count_reset_date is < today (Europe/London).
  daily_outfit_count int not null default 0,
  daily_count_reset_date date not null default
    ((now() at time zone 'Europe/London')::date),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_subscriptions_due_idx
  on user_subscriptions (current_period_end)
  where status = 'active';

create table topup_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource topup_resource not null,
  amount_granted int not null check (amount_granted > 0),
  amount_remaining int not null check (amount_remaining >= 0),
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'GBP',
  purchased_at timestamptz not null default now()
);

create index topup_purchases_user_resource_idx
  on topup_purchases (user_id, resource, purchased_at)
  where amount_remaining > 0;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table user_subscriptions enable row level security;
alter table topup_purchases    enable row level security;

create policy "own subscription view" on user_subscriptions for select
  using (user_id = auth.uid());

create policy "own topups view" on topup_purchases for select
  using (user_id = auth.uid());

-- All writes happen via SECURITY DEFINER functions called from the server.
-- No insert/update/delete policies for end users.

create trigger user_subscriptions_updated_at before update on user_subscriptions
  for each row execute function update_updated_at();

-- ============================================================
-- RPC: subscribe_tier
-- ------------------------------------------------------------
-- Called from /api/billing/subscribe. Creates a new active subscription or
-- replaces an existing inactive one. Refuses if there's already an active
-- subscription (the caller should route through schedule_tier_change for
-- upgrades instead).
-- ============================================================
create or replace function subscribe_tier(
  p_user_id uuid,
  p_tier subscription_tier,
  p_initial_tryon int,
  p_initial_wardrobe int,
  p_period_days int default 30
) returns user_subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_existing user_subscriptions;
  v_result user_subscriptions;
begin
  select * into v_existing from user_subscriptions where user_id = p_user_id;

  if v_existing.user_id is not null and v_existing.status = 'active' then
    raise exception 'already_subscribed' using errcode = '22023';
  end if;

  insert into user_subscriptions (
    user_id, tier, status,
    current_period_start, current_period_end,
    sub_tryon_credits, sub_wardrobe_credits,
    daily_outfit_count, daily_count_reset_date
  ) values (
    p_user_id, p_tier, 'active',
    now(), now() + (p_period_days || ' days')::interval,
    p_initial_tryon, p_initial_wardrobe,
    0, (now() at time zone 'Europe/London')::date
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    status = 'active',
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    pending_tier_change = null,
    sub_tryon_credits = excluded.sub_tryon_credits,
    sub_wardrobe_credits = user_subscriptions.sub_wardrobe_credits + excluded.sub_wardrobe_credits,
    daily_outfit_count = 0,
    daily_count_reset_date = (now() at time zone 'Europe/London')::date,
    updated_at = now()
  returning * into v_result;

  return v_result;
end $$;

-- ============================================================
-- RPC: schedule_tier_change
-- ------------------------------------------------------------
-- Upgrade (standard → pro): immediate. Sub credits top up to at least Pro's
-- monthly grant amounts (the caller passes those as params).
-- Downgrade (pro → standard): scheduled. Sets pending_tier_change; the next
-- advance_billing_cycle applies it on renewal.
-- ============================================================
create or replace function schedule_tier_change(
  p_user_id uuid,
  p_new_tier subscription_tier,
  p_pro_monthly_tryon int,
  p_pro_initial_wardrobe int
) returns user_subscriptions
language plpgsql security definer set search_path = public as $$
declare
  v_current_tier subscription_tier;
  v_result user_subscriptions;
begin
  select tier into v_current_tier from user_subscriptions
   where user_id = p_user_id and status = 'active';

  if v_current_tier is null then
    raise exception 'no_active_subscription' using errcode = '22023';
  end if;
  if v_current_tier = p_new_tier then
    raise exception 'same_tier' using errcode = '22023';
  end if;

  if v_current_tier = 'standard' and p_new_tier = 'pro' then
    -- Immediate upgrade: bump sub credits up to Pro's grant.
    update user_subscriptions
       set tier = 'pro',
           sub_tryon_credits = greatest(sub_tryon_credits, p_pro_monthly_tryon),
           sub_wardrobe_credits = greatest(sub_wardrobe_credits, p_pro_initial_wardrobe),
           pending_tier_change = null,
           updated_at = now()
     where user_id = p_user_id and status = 'active'
     returning * into v_result;
  else
    -- Downgrade: schedule for next renewal.
    update user_subscriptions
       set pending_tier_change = p_new_tier,
           updated_at = now()
     where user_id = p_user_id and status = 'active'
     returning * into v_result;
  end if;

  return v_result;
end $$;

-- ============================================================
-- RPC: cancel_subscription
-- ------------------------------------------------------------
-- Marks cancel_at_period_end. Service continues until current_period_end;
-- advance_billing_cycle will flip status to 'cancelled' and zero sub credits
-- when the period ends.
-- ============================================================
create or replace function cancel_subscription(p_user_id uuid)
returns user_subscriptions
language plpgsql security definer set search_path = public as $$
declare v_row user_subscriptions;
begin
  update user_subscriptions
     set cancel_at_period_end = true,
         pending_tier_change = null,
         updated_at = now()
   where user_id = p_user_id
     and status = 'active'
   returning * into v_row;

  if v_row.user_id is null then
    raise exception 'no_active_subscription' using errcode = '22023';
  end if;
  return v_row;
end $$;

-- ============================================================
-- RPC: reactivate_subscription
-- ------------------------------------------------------------
-- Undoes a pending cancellation while still inside the current period.
-- ============================================================
create or replace function reactivate_subscription(p_user_id uuid)
returns user_subscriptions
language plpgsql security definer set search_path = public as $$
declare v_row user_subscriptions;
begin
  update user_subscriptions
     set cancel_at_period_end = false,
         updated_at = now()
   where user_id = p_user_id
     and status = 'active'
     and cancel_at_period_end = true
   returning * into v_row;
  return v_row;
end $$;

-- ============================================================
-- RPC: purchase_topup
-- ------------------------------------------------------------
-- Records a durable top-up purchase. Caller supplies amount and price.
-- ============================================================
create or replace function purchase_topup(
  p_user_id uuid,
  p_resource topup_resource,
  p_amount int,
  p_price_cents int,
  p_currency text default 'GBP'
) returns topup_purchases
language plpgsql security definer set search_path = public as $$
declare v_row topup_purchases;
begin
  insert into topup_purchases (
    user_id, resource, amount_granted, amount_remaining, price_cents, currency
  ) values (
    p_user_id, p_resource, p_amount, p_amount, p_price_cents, p_currency
  )
  returning * into v_row;
  return v_row;
end $$;

-- ============================================================
-- RPC: consume_tryon  /  consume_wardrobe
-- ------------------------------------------------------------
-- Atomic decrement. Subscription credits consumed first, then oldest top-up
-- with remaining balance. Returns:
--   { ok: true, source: 'subscription' | 'topup', topup_id?: uuid }
--   { ok: false, error: 'no_credits' | 'no_active_subscription' }
-- The `source` (and `topup_id`) must be passed back to refund_X on failure.
-- ============================================================
create or replace function consume_tryon(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_topup_id uuid;
  v_active bool;
begin
  -- Active subscription? (Required even for top-up consumption — top-ups
  -- without an active sub means you cancelled; service stopped.)
  select true into v_active from user_subscriptions
   where user_id = p_user_id and status = 'active';
  if v_active is null then
    return jsonb_build_object('ok', false, 'error', 'no_active_subscription');
  end if;

  -- Sub bucket first.
  update user_subscriptions
     set sub_tryon_credits = sub_tryon_credits - 1,
         updated_at = now()
   where user_id = p_user_id
     and status = 'active'
     and sub_tryon_credits > 0;
  if found then
    return jsonb_build_object('ok', true, 'source', 'subscription');
  end if;

  -- Oldest top-up with remaining balance.
  update topup_purchases
     set amount_remaining = amount_remaining - 1
   where id = (
     select id from topup_purchases
      where user_id = p_user_id
        and resource = 'tryon'
        and amount_remaining > 0
      order by purchased_at asc
      limit 1
      for update skip locked
   )
   returning id into v_topup_id;
  if found then
    return jsonb_build_object('ok', true, 'source', 'topup', 'topup_id', v_topup_id);
  end if;

  return jsonb_build_object('ok', false, 'error', 'no_credits');
end $$;

create or replace function consume_wardrobe(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_topup_id uuid;
  v_active bool;
begin
  select true into v_active from user_subscriptions
   where user_id = p_user_id and status = 'active';
  if v_active is null then
    return jsonb_build_object('ok', false, 'error', 'no_active_subscription');
  end if;

  update user_subscriptions
     set sub_wardrobe_credits = sub_wardrobe_credits - 1,
         updated_at = now()
   where user_id = p_user_id
     and status = 'active'
     and sub_wardrobe_credits > 0;
  if found then
    return jsonb_build_object('ok', true, 'source', 'subscription');
  end if;

  update topup_purchases
     set amount_remaining = amount_remaining - 1
   where id = (
     select id from topup_purchases
      where user_id = p_user_id
        and resource = 'wardrobe_add'
        and amount_remaining > 0
      order by purchased_at asc
      limit 1
      for update skip locked
   )
   returning id into v_topup_id;
  if found then
    return jsonb_build_object('ok', true, 'source', 'topup', 'topup_id', v_topup_id);
  end if;

  return jsonb_build_object('ok', false, 'error', 'no_credits');
end $$;

-- ============================================================
-- RPC: refund_tryon  /  refund_wardrobe
-- ------------------------------------------------------------
-- Inverse of consume. Source determines which pool to credit back. Used on
-- transient AI failures only (caller decides — bad-input errors don't refund).
-- ============================================================
create or replace function refund_tryon(
  p_user_id uuid, p_source text, p_topup_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_source = 'subscription' then
    update user_subscriptions
       set sub_tryon_credits = sub_tryon_credits + 1,
           updated_at = now()
     where user_id = p_user_id;
  elsif p_source = 'topup' and p_topup_id is not null then
    update topup_purchases
       set amount_remaining = amount_remaining + 1
     where id = p_topup_id and user_id = p_user_id;
  end if;
end $$;

create or replace function refund_wardrobe(
  p_user_id uuid, p_source text, p_topup_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_source = 'subscription' then
    update user_subscriptions
       set sub_wardrobe_credits = sub_wardrobe_credits + 1,
           updated_at = now()
     where user_id = p_user_id;
  elsif p_source = 'topup' and p_topup_id is not null then
    update topup_purchases
       set amount_remaining = amount_remaining + 1
     where id = p_topup_id and user_id = p_user_id;
  end if;
end $$;

-- ============================================================
-- RPC: consume_outfit_with_cap
-- ------------------------------------------------------------
-- Hidden daily rate limit on outfit generations. Resets at London midnight.
-- Returns:
--   { ok: true, today_count: int }
--   { ok: false, error: 'daily_cap_reached', cap, today_count }
--   { ok: false, error: 'no_active_subscription' }
-- ============================================================
create or replace function consume_outfit_with_cap(
  p_user_id uuid, p_cap int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date;
  v_row user_subscriptions;
  v_new_count int;
begin
  v_today := (now() at time zone 'Europe/London')::date;

  select * into v_row from user_subscriptions
   where user_id = p_user_id and status = 'active'
   for update;

  if v_row.user_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_active_subscription');
  end if;

  -- Lazy reset.
  if v_row.daily_count_reset_date < v_today then
    v_row.daily_outfit_count := 0;
    v_row.daily_count_reset_date := v_today;
  end if;

  if v_row.daily_outfit_count >= p_cap then
    update user_subscriptions
       set daily_count_reset_date = v_today,
           updated_at = now()
     where user_id = p_user_id;
    return jsonb_build_object(
      'ok', false, 'error', 'daily_cap_reached',
      'cap', p_cap, 'today_count', v_row.daily_outfit_count
    );
  end if;

  v_new_count := v_row.daily_outfit_count + 1;
  update user_subscriptions
     set daily_outfit_count = v_new_count,
         daily_count_reset_date = v_today,
         updated_at = now()
   where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'today_count', v_new_count);
end $$;

create or replace function refund_outfit(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update user_subscriptions
     set daily_outfit_count = greatest(daily_outfit_count - 1, 0),
         updated_at = now()
   where user_id = p_user_id;
end $$;

-- ============================================================
-- RPC: advance_billing_cycle
-- ------------------------------------------------------------
-- Per-user renewal. Called by the cron endpoint when current_period_end <= now.
-- Caller passes plan grant amounts for the *target* tier (after any pending
-- downgrade has been applied) so DB doesn't need to know plan numbers.
-- ============================================================
create or replace function advance_billing_cycle(
  p_user_id uuid,
  p_target_tier subscription_tier,
  p_monthly_tryon int,
  p_monthly_wardrobe_drip int,
  p_period_days int default 30
) returns user_subscriptions
language plpgsql security definer set search_path = public as $$
declare v_row user_subscriptions;
begin
  select * into v_row from user_subscriptions
   where user_id = p_user_id for update;

  if v_row.user_id is null then
    raise exception 'no_subscription' using errcode = '22023';
  end if;

  -- Cancellation takes effect now.
  if v_row.cancel_at_period_end and v_row.status = 'active' then
    update user_subscriptions
       set status = 'cancelled',
           sub_tryon_credits = 0,
           sub_wardrobe_credits = 0,
           cancel_at_period_end = false,
           pending_tier_change = null,
           updated_at = now()
     where user_id = p_user_id
     returning * into v_row;
    return v_row;
  end if;

  if v_row.status <> 'active' then
    return v_row;
  end if;

  -- Renewal: reset try-ons, drip wardrobe, advance period, zero daily.
  update user_subscriptions
     set tier = p_target_tier,
         pending_tier_change = null,
         sub_tryon_credits = p_monthly_tryon,
         sub_wardrobe_credits = sub_wardrobe_credits + p_monthly_wardrobe_drip,
         current_period_start = current_period_end,
         current_period_end = current_period_end + (p_period_days || ' days')::interval,
         daily_outfit_count = 0,
         daily_count_reset_date = (now() at time zone 'Europe/London')::date,
         updated_at = now()
   where user_id = p_user_id
   returning * into v_row;

  return v_row;
end $$;

-- ============================================================
-- Grant execute on the RPCs to authenticated users for the consume/refund
-- and read-only fetches. Subscribe/cancel/topup go through the admin client
-- from API routes only.
-- ============================================================
grant execute on function consume_tryon(uuid) to authenticated;
grant execute on function consume_wardrobe(uuid) to authenticated;
grant execute on function consume_outfit_with_cap(uuid, int) to authenticated;
grant execute on function refund_tryon(uuid, text, uuid) to authenticated;
grant execute on function refund_wardrobe(uuid, text, uuid) to authenticated;
grant execute on function refund_outfit(uuid) to authenticated;
-- The following are admin-only (mutate billing state); no grant.
revoke execute on function subscribe_tier(uuid, subscription_tier, int, int, int) from public;
revoke execute on function schedule_tier_change(uuid, subscription_tier, int, int) from public;
revoke execute on function cancel_subscription(uuid) from public;
revoke execute on function reactivate_subscription(uuid) from public;
revoke execute on function purchase_topup(uuid, topup_resource, int, int, text) from public;
revoke execute on function advance_billing_cycle(uuid, subscription_tier, int, int, int) from public;
