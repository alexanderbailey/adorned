-- ============================================================
-- Checkout sessions — Stripe-Hosted-Checkout-shaped dummy payment
-- ============================================================
-- Mirrors a Stripe Checkout Session so the dummy flow matches the real one:
--   1. App creates a `pending` session (stand-in for stripe.checkout.sessions.create).
--   2. The user is sent to a checkout surface. In dev that's /checkout/simulate;
--      in production it'll be Stripe's hosted page (redirect to session.url).
--   3. Provisioning happens AFTER payment confirmation, driven by the webhook
--      (real Stripe) or the authed confirm route (dummy) — never the redirect.
--      The session row is the idempotency anchor: it can only be claimed once.
--
-- When real Stripe is wired: keep this table (store the Stripe session id in
-- `id` or add a column), delete /checkout/simulate + the confirm route, and let
-- the webhook verify the Stripe signature. provisionCheckoutSession() and the
-- subscribe_tier / purchase_topup RPCs stay unchanged.
-- ============================================================

create type checkout_mode as enum ('subscription', 'payment');
create type checkout_status as enum ('pending', 'completed', 'expired');

create table billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode checkout_mode not null,

  -- subscription mode: which tier. payment mode: which top-up pack key.
  tier subscription_tier,
  pack text,

  -- Display only — the authoritative grant amounts are computed in app code at
  -- provision time (first-time vs re-subscribe), matching the plan source.
  amount_cents int not null default 0 check (amount_cents >= 0),
  currency text not null default 'GBP',

  status checkout_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  -- A subscription session needs a tier; a payment session needs a pack.
  constraint checkout_target_present check (
    (mode = 'subscription' and tier is not null) or
    (mode = 'payment' and pack is not null)
  )
);

create index billing_checkout_sessions_user_pending_idx
  on billing_checkout_sessions (user_id, created_at)
  where status = 'pending';

alter table billing_checkout_sessions enable row level security;

-- Users may read their own sessions (the simulator page loads it server-side
-- via the admin client, but this keeps RLS consistent with the other tables).
create policy "own checkout sessions view" on billing_checkout_sessions for select
  using (user_id = auth.uid());

-- All writes happen via the admin client from server routes (create + the
-- atomic claim: update ... where status = 'pending'). No end-user write policy.
