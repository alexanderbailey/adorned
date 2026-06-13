import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PLANS,
  TOPUPS,
  BILLING_PERIOD_DAYS,
  type TierKey,
  type TopupKey,
} from "./plans";

// ============================================================
// Checkout sessions — Stripe-Hosted-Checkout-shaped dummy flow.
//
// createCheckoutSession()      -> stand-in for stripe.checkout.sessions.create
// provisionCheckoutSession()   -> the single provisioning entry point, called
//                                 by the dummy confirm route now and by the
//                                 real Stripe webhook later. The session row is
//                                 the idempotency anchor (claim-once).
// ============================================================

export type CheckoutMode = "subscription" | "payment";

interface CreateOk {
  ok: true;
  sessionId: string;
}
interface CreateErr {
  ok: false;
  error: string;
  status: 400 | 403 | 409 | 500;
}

interface ProvisionResult {
  ok: boolean;
  // Returned so callers can route the user appropriately after payment.
  mode?: CheckoutMode;
  tier?: TierKey;
  alreadyProcessed?: boolean;
  error?: string;
}

export async function createCheckoutSession(params: {
  userId: string;
  mode: CheckoutMode;
  tier?: TierKey;
  pack?: TopupKey;
}): Promise<CreateOk | CreateErr> {
  const { userId, mode } = params;
  const admin = createAdminClient();

  if (mode === "subscription") {
    const tier = params.tier;
    if (!tier || !(tier in PLANS)) {
      return { ok: false, error: "invalid_tier", status: 400 };
    }
    // Refuse a new subscription checkout if one is already active — tier
    // changes go through /api/billing/change-tier instead (Stripe would update
    // the existing subscription, not open a fresh Checkout).
    const { data: existing } = await admin
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.status === "active") {
      return { ok: false, error: "already_subscribed", status: 409 };
    }

    const plan = PLANS[tier];
    const { data, error } = await admin
      .from("billing_checkout_sessions")
      .insert({
        user_id: userId,
        mode: "subscription",
        tier,
        amount_cents: plan.monthlyPriceCents,
        currency: plan.currency,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message, status: 500 };
    return { ok: true, sessionId: data.id };
  }

  // payment mode (top-up pack)
  const pack = params.pack;
  if (!pack || !(pack in TOPUPS)) {
    return { ok: false, error: "invalid_pack", status: 400 };
  }
  // Top-ups are only sold to active subscribers (matches the prior topup route).
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (sub?.status !== "active") {
    return { ok: false, error: "no_active_subscription", status: 403 };
  }

  const def = TOPUPS[pack];
  const { data, error } = await admin
    .from("billing_checkout_sessions")
    .insert({
      user_id: userId,
      mode: "payment",
      pack,
      amount_cents: def.priceCents,
      currency: def.currency,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message, status: 500 };
  return { ok: true, sessionId: data.id };
}

// Provision a paid checkout. Idempotent: atomically claims the session
// (pending -> completed) and only provisions if the claim won the row, so a
// duplicate/replayed webhook can never double-grant. On provisioning failure
// the session is returned to `pending` so it can be retried.
export async function provisionCheckoutSession(
  sessionId: string
): Promise<ProvisionResult> {
  const admin = createAdminClient();

  const { data: claimed, error: claimErr } = await admin
    .from("billing_checkout_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "pending")
    .select("id, user_id, mode, tier, pack")
    .maybeSingle();
  if (claimErr) return { ok: false, error: claimErr.message };
  if (!claimed) {
    // Already completed/expired or unknown id — treat as a no-op success so
    // replayed webhooks return 200 without side effects.
    return { ok: true, alreadyProcessed: true };
  }

  try {
    if (claimed.mode === "subscription") {
      const tier = claimed.tier as TierKey;
      const plan = PLANS[tier];
      // First-time subscribers get the initial wardrobe grant; re-subscribers
      // get the monthly drip — otherwise cancel/re-sub would mint free grants.
      // The subscription row persists through cancellation, so its existence is
      // the first-time signal (matches the original subscribe route).
      const { data: existingSub } = await admin
        .from("user_subscriptions")
        .select("user_id")
        .eq("user_id", claimed.user_id)
        .maybeSingle();
      const isFirstTime = !existingSub;
      const wardrobeGrant = isFirstTime
        ? plan.initialWardrobeGrant
        : plan.monthlyWardrobeDrip;

      const { error } = await admin.rpc("subscribe_tier", {
        p_user_id: claimed.user_id,
        p_tier: tier,
        p_initial_tryon: plan.monthlyTryons,
        p_initial_wardrobe: wardrobeGrant,
        p_period_days: BILLING_PERIOD_DAYS,
      });
      if (error) throw new Error(error.message);
      return { ok: true, mode: "subscription", tier };
    }

    // payment mode — top-up pack
    const def = TOPUPS[claimed.pack as TopupKey];
    const { error } = await admin.rpc("purchase_topup", {
      p_user_id: claimed.user_id,
      p_resource: def.resource,
      p_amount: def.amount,
      p_price_cents: def.priceCents,
      p_currency: def.currency,
    });
    if (error) throw new Error(error.message);
    return { ok: true, mode: "payment" };
  } catch (err) {
    // Roll the claim back so the payment can be retried.
    await admin
      .from("billing_checkout_sessions")
      .update({ status: "pending", completed_at: null })
      .eq("id", claimed.id);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "provision_failed",
    };
  }
}

// Load a session for the simulator page / confirm route. Returns null if it
// doesn't exist or isn't owned by the user.
export async function getCheckoutSession(sessionId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_checkout_sessions")
    .select("id, user_id, mode, tier, pack, amount_cents, currency, status")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}
