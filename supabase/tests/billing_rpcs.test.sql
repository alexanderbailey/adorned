-- ============================================================
-- Billing RPC behaviour tests
-- ------------------------------------------------------------
-- Exercises the SECURITY DEFINER functions from 0007_billing.sql against a
-- throwaway Postgres (see run.sh). Each scenario uses a distinct seeded user.
-- Assertions use plpgsql ASSERT — any failure aborts psql with ON_ERROR_STOP
-- and run.sh reports it. Plan numbers are passed in by the caller in prod, so
-- the tests pass them explicitly here too (they are not read from the DB).
-- ============================================================

-- Seed test users (FK target for the billing tables).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'a@test'),
  ('00000000-0000-0000-0000-000000000002', 'b@test'),
  ('00000000-0000-0000-0000-000000000003', 'c@test'),
  ('00000000-0000-0000-0000-000000000004', 'd@test'),
  ('00000000-0000-0000-0000-000000000005', 'e@test'),
  ('00000000-0000-0000-0000-000000000006', 'f@test');

-- ------------------------------------------------------------
-- A. subscribe_tier: initial grant, refusal of double-subscribe,
--    consume ordering (sub bucket before oldest top-up), and refund.
-- ------------------------------------------------------------
do $$
declare
  uid uuid := '00000000-0000-0000-0000-000000000001';
  r jsonb;
begin
  perform subscribe_tier(uid, 'standard', 25, 300, 30);
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 25,
    'A: initial tryon grant should be 25';
  assert (select sub_wardrobe_credits from user_subscriptions where user_id = uid) = 300,
    'A: initial wardrobe grant should be 300';
  assert (select status from user_subscriptions where user_id = uid) = 'active',
    'A: status should be active';

  -- Second subscribe while active must be refused.
  begin
    perform subscribe_tier(uid, 'pro', 100, 500, 30);
    raise exception 'A: expected already_subscribed, none raised';
  exception when others then
    assert sqlerrm = 'already_subscribed',
      'A: expected already_subscribed, got: ' || sqlerrm;
  end;

  -- Set up a 1-credit sub bucket plus a 5-credit top-up.
  perform purchase_topup(uid, 'tryon', 5, 0, 'GBP');
  update user_subscriptions set sub_tryon_credits = 1 where user_id = uid;

  -- First consume drains the subscription bucket.
  r := consume_tryon(uid);
  assert r->>'source' = 'subscription', 'A: first consume should hit subscription, got ' || coalesce(r::text, 'null');
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 0,
    'A: sub tryon should be 0 after consume';

  -- Next consume falls through to the top-up.
  r := consume_tryon(uid);
  assert r->>'source' = 'topup', 'A: second consume should hit topup, got ' || coalesce(r::text, 'null');
  assert (select amount_remaining from topup_purchases where user_id = uid and resource = 'tryon') = 4,
    'A: topup remaining should be 4';

  -- Refund the top-up consumption.
  perform refund_tryon(uid, 'topup', (r->>'topup_id')::uuid);
  assert (select amount_remaining from topup_purchases where user_id = uid and resource = 'tryon') = 5,
    'A: topup remaining should be 5 after refund';

  raise notice 'A passed: subscribe / double-subscribe guard / consume ordering / refund';
end $$;

-- ------------------------------------------------------------
-- B. Daily outfit cap: increments, blocks at cap, resets at London midnight.
-- ------------------------------------------------------------
do $$
declare
  uid uuid := '00000000-0000-0000-0000-000000000006';
  r jsonb;
begin
  perform subscribe_tier(uid, 'standard', 25, 300, 30);

  r := consume_outfit_with_cap(uid, 2);
  assert r->>'ok' = 'true', 'B: 1st outfit should succeed';
  r := consume_outfit_with_cap(uid, 2);
  assert r->>'ok' = 'true', 'B: 2nd outfit should succeed';
  r := consume_outfit_with_cap(uid, 2);
  assert r->>'ok' = 'false' and r->>'error' = 'daily_cap_reached',
    'B: 3rd outfit should hit cap, got ' || r::text;
  assert (select daily_outfit_count from user_subscriptions where user_id = uid) = 2,
    'B: count should stay at cap (2)';

  -- Simulate a previous day so the lazy reset fires.
  update user_subscriptions
     set daily_count_reset_date = (now() at time zone 'Europe/London')::date - 1
   where user_id = uid;
  r := consume_outfit_with_cap(uid, 2);
  assert r->>'ok' = 'true', 'B: outfit should succeed after daily reset';
  assert (select daily_outfit_count from user_subscriptions where user_id = uid) = 1,
    'B: count should be 1 after reset+consume';

  raise notice 'B passed: daily cap enforce + reset';
end $$;

-- ------------------------------------------------------------
-- C. Cancellation: cancel sets the flag; advance_billing_cycle flips the
--    subscription to cancelled and zeroes the sub credits.
-- ------------------------------------------------------------
do $$
declare uid uuid := '00000000-0000-0000-0000-000000000002';
begin
  perform subscribe_tier(uid, 'standard', 25, 300, 30);
  perform cancel_subscription(uid);
  assert (select cancel_at_period_end from user_subscriptions where user_id = uid) = true,
    'C: cancel_at_period_end should be true';
  assert (select status from user_subscriptions where user_id = uid) = 'active',
    'C: still active until period end';

  perform advance_billing_cycle(uid, 'standard', 25, 30, 30);
  assert (select status from user_subscriptions where user_id = uid) = 'cancelled',
    'C: status should be cancelled after advance';
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 0
     and (select sub_wardrobe_credits from user_subscriptions where user_id = uid) = 0,
    'C: credits should be zeroed on cancellation';

  raise notice 'C passed: cancel + advance zeroes credits';
end $$;

-- ------------------------------------------------------------
-- D. Downgrade is deferred: schedule_tier_change(pro->standard) sets a
--    pending change without altering the live tier; advance applies it.
-- ------------------------------------------------------------
do $$
declare uid uuid := '00000000-0000-0000-0000-000000000003';
begin
  perform subscribe_tier(uid, 'pro', 100, 500, 30);
  perform schedule_tier_change(uid, 'standard', 100, 500);
  assert (select pending_tier_change from user_subscriptions where user_id = uid) = 'standard',
    'D: pending_tier_change should be standard';
  assert (select tier from user_subscriptions where user_id = uid) = 'pro',
    'D: live tier should remain pro until renewal';

  -- Caller computes the target tier's grants; here standard = 25 tryon, +30 drip.
  perform advance_billing_cycle(uid, 'standard', 25, 30, 30);
  assert (select tier from user_subscriptions where user_id = uid) = 'standard',
    'D: tier should be standard after advance';
  assert (select pending_tier_change from user_subscriptions where user_id = uid) is null,
    'D: pending change should be cleared';
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 25,
    'D: tryon should reset to standard grant (25)';
  assert (select sub_wardrobe_credits from user_subscriptions where user_id = uid) = 530,
    'D: wardrobe should accumulate 500 + 30 drip = 530';

  raise notice 'D passed: deferred downgrade applied on advance';
end $$;

-- ------------------------------------------------------------
-- E. Upgrade is immediate: schedule_tier_change(standard->pro) bumps tier now
--    and tops sub credits up to at least Pro's grant (greatest()).
-- ------------------------------------------------------------
do $$
declare uid uuid := '00000000-0000-0000-0000-000000000004';
begin
  perform subscribe_tier(uid, 'standard', 25, 300, 30);
  perform schedule_tier_change(uid, 'pro', 100, 500);
  assert (select tier from user_subscriptions where user_id = uid) = 'pro',
    'E: tier should be pro immediately';
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 100,
    'E: tryon should rise to Pro grant (greatest(25,100)=100)';
  assert (select sub_wardrobe_credits from user_subscriptions where user_id = uid) = 500,
    'E: wardrobe should rise to Pro grant (greatest(300,500)=500)';

  raise notice 'E passed: immediate upgrade tops up credits';
end $$;

-- ------------------------------------------------------------
-- F. Renewal of an active, non-cancelling sub: try-ons reset, wardrobe drips
--    (accumulates), period rolls forward, daily counter zeroes.
-- ------------------------------------------------------------
do $$
declare
  uid uuid := '00000000-0000-0000-0000-000000000005';
  prev_end timestamptz;
begin
  perform subscribe_tier(uid, 'standard', 25, 300, 30);
  update user_subscriptions
     set sub_tryon_credits = 3, sub_wardrobe_credits = 310, daily_outfit_count = 7
   where user_id = uid;
  select current_period_end into prev_end from user_subscriptions where user_id = uid;

  perform advance_billing_cycle(uid, 'standard', 25, 30, 30);
  assert (select sub_tryon_credits from user_subscriptions where user_id = uid) = 25,
    'F: tryon should reset to monthly grant (25)';
  assert (select sub_wardrobe_credits from user_subscriptions where user_id = uid) = 340,
    'F: wardrobe should accumulate 310 + 30 drip = 340';
  assert (select current_period_start from user_subscriptions where user_id = uid) = prev_end,
    'F: new period_start should equal the old period_end';
  assert (select daily_outfit_count from user_subscriptions where user_id = uid) = 0,
    'F: daily counter should reset to 0';

  raise notice 'F passed: renewal resets/drips/advances';
end $$;

-- ------------------------------------------------------------
-- G. Consume guards: no active subscription => no_active_subscription;
--    active but empty pools => no_credits.
-- ------------------------------------------------------------
do $$
declare
  cancelled_uid uuid := '00000000-0000-0000-0000-000000000002'; -- cancelled in C
  empty_uid uuid := '00000000-0000-0000-0000-000000000005';     -- active (from F)
  r jsonb;
begin
  r := consume_tryon(cancelled_uid);
  assert r->>'ok' = 'false' and r->>'error' = 'no_active_subscription',
    'G: cancelled user should get no_active_subscription, got ' || r::text;

  update user_subscriptions set sub_tryon_credits = 0 where user_id = empty_uid;
  r := consume_tryon(empty_uid);
  assert r->>'ok' = 'false' and r->>'error' = 'no_credits',
    'G: drained active user should get no_credits, got ' || r::text;

  raise notice 'G passed: consume guards';
end $$;

-- ------------------------------------------------------------
-- H. Checkout session claim is idempotent: the conditional update
--    (status = 'pending') can only win once, so a replayed webhook /
--    double-confirm cannot double-provision. Mirrors the claim in
--    provisionCheckoutSession().
-- ------------------------------------------------------------
do $$
declare
  uid uuid := '00000000-0000-0000-0000-000000000001';
  sid uuid;
  claimed1 uuid;
  claimed2 uuid;
begin
  insert into billing_checkout_sessions (user_id, mode, tier, amount_cents)
    values (uid, 'subscription', 'pro', 2000)
    returning id into sid;

  update billing_checkout_sessions
     set status = 'completed', completed_at = now()
   where id = sid and status = 'pending'
   returning id into claimed1;
  assert claimed1 is not null, 'H: first claim should win the row';

  update billing_checkout_sessions
     set status = 'completed', completed_at = now()
   where id = sid and status = 'pending'
   returning id into claimed2;
  assert claimed2 is null, 'H: second claim should find no pending row';
  assert (select status from billing_checkout_sessions where id = sid) = 'completed',
    'H: session should remain completed';

  -- The target-present constraint must reject a malformed session.
  begin
    insert into billing_checkout_sessions (user_id, mode, amount_cents)
      values (uid, 'subscription', 2000); -- no tier
    raise exception 'H: expected checkout_target_present violation';
  exception when check_violation then null;
  end;

  raise notice 'H passed: checkout session claim idempotency + constraint';
end $$;

select 'ALL BILLING RPC TESTS PASSED' as result;
