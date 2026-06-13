import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type TierKey } from "./plans";

export interface TopupPurchaseLite {
  id: string;
  resource: "tryon" | "wardrobe_add";
  amount_granted: number;
  amount_remaining: number;
  purchased_at: string;
}

export interface EntitlementsSnapshot {
  hasActiveSubscription: boolean;
  tier: TierKey | null;
  status: "active" | "cancelled" | "past_due" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pendingTierChange: TierKey | null;

  // Subscription pool
  subTryonCredits: number;
  subWardrobeCredits: number;

  // Top-up pool (sum-remaining per resource)
  topupTryonBalance: number;
  topupWardrobeBalance: number;

  // Totals = sub + topup
  tryonCreditsTotal: number;
  wardrobeCreditsTotal: number;

  // Daily outfit counter (today)
  dailyOutfitCount: number;
  dailyOutfitCap: number;
  dailyOutfitRemaining: number;

  topupPurchases: TopupPurchaseLite[];
}

// Server-side read. Uses the admin client because we want to bypass RLS
// safely (the caller has already authenticated the user_id).
export async function getEntitlements(
  userId: string
): Promise<EntitlementsSnapshot> {
  const admin = createAdminClient();

  const [subRes, topupsRes] = await Promise.all([
    admin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("topup_purchases")
      .select("id, resource, amount_granted, amount_remaining, purchased_at")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false }),
  ]);

  const sub = subRes.data;
  const topups = topupsRes.data ?? [];

  const topupTryonBalance = topups
    .filter((t) => t.resource === "tryon")
    .reduce((sum, t) => sum + t.amount_remaining, 0);
  const topupWardrobeBalance = topups
    .filter((t) => t.resource === "wardrobe_add")
    .reduce((sum, t) => sum + t.amount_remaining, 0);

  const isActive = sub?.status === "active";
  const tier = (sub?.tier ?? null) as TierKey | null;
  const plan = tier ? PLANS[tier] : null;

  const subTryonCredits = isActive ? (sub?.sub_tryon_credits ?? 0) : 0;
  const subWardrobeCredits = isActive ? (sub?.sub_wardrobe_credits ?? 0) : 0;

  // Daily counter: if last reset date is before today (London), effective count is 0.
  // en-CA gives YYYY-MM-DD, which matches Postgres `date` text format directly.
  const todayLondon = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const lastReset = sub?.daily_count_reset_date ?? todayLondon;
  const effectiveDailyCount =
    lastReset === todayLondon ? (sub?.daily_outfit_count ?? 0) : 0;
  const dailyCap = plan?.dailyOutfitCap ?? 0;

  return {
    hasActiveSubscription: isActive,
    tier,
    status: (sub?.status ?? null) as EntitlementsSnapshot["status"],
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    pendingTierChange: (sub?.pending_tier_change ?? null) as TierKey | null,

    subTryonCredits,
    subWardrobeCredits,
    topupTryonBalance,
    topupWardrobeBalance,
    tryonCreditsTotal: subTryonCredits + topupTryonBalance,
    wardrobeCreditsTotal: subWardrobeCredits + topupWardrobeBalance,

    dailyOutfitCount: effectiveDailyCount,
    dailyOutfitCap: dailyCap,
    dailyOutfitRemaining: Math.max(0, dailyCap - effectiveDailyCount),

    topupPurchases: topups,
  };
}
