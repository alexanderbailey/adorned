import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, BILLING_PERIOD_DAYS, type TierKey } from "./plans";

interface AdvanceResult {
  ok: true;
  subscription: unknown;
}
interface AdvanceErr {
  ok: false;
  error: string;
}

// Apply renewal / cancellation / pending-downgrade for one user. The DB RPC
// receives the *target tier*'s grant amounts so plan numbers stay in code.
export async function advanceUserCycle(
  userId: string
): Promise<AdvanceResult | AdvanceErr> {
  const admin = createAdminClient();

  const { data: sub, error: readErr } = await admin
    .from("user_subscriptions")
    .select("tier, pending_tier_change, cancel_at_period_end, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!sub) return { ok: false, error: "no_subscription" };

  // If cancellation is pending, the RPC will zero credits regardless of tier
  // params, but we still pass *something* valid.
  const targetTier: TierKey =
    sub.pending_tier_change ?? (sub.tier as TierKey);
  const plan = PLANS[targetTier];

  const { data, error } = await admin.rpc("advance_billing_cycle", {
    p_user_id: userId,
    p_target_tier: targetTier,
    p_monthly_tryon: plan.monthlyTryons,
    p_monthly_wardrobe_drip: plan.monthlyWardrobeDrip,
    p_period_days: BILLING_PERIOD_DAYS,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, subscription: data };
}
