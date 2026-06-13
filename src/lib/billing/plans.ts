// Single source of truth for plan and top-up pack definitions. Edit and
// redeploy — DB stores plan keys, not numbers. Migration 0007 RPCs accept
// these grant amounts as parameters at call time.

export type TierKey = "standard" | "pro";
export type TopupKey = "wardrobe_50" | "tryon_20";
export type TopupResource = "tryon" | "wardrobe_add";
export type Currency = "GBP";

export interface PlanDef {
  key: TierKey;
  label: string;
  monthlyPriceCents: number;
  currency: Currency;
  initialWardrobeGrant: number;
  monthlyWardrobeDrip: number;
  monthlyTryons: number;
  dailyOutfitCap: number;
}

export interface TopupDef {
  key: TopupKey;
  label: string;
  resource: TopupResource;
  amount: number;
  priceCents: number;
  currency: Currency;
}

export const BILLING_PERIOD_DAYS = 30;

export const PLANS: Record<TierKey, PlanDef> = {
  standard: {
    key: "standard",
    label: "Standard",
    monthlyPriceCents: 800,
    currency: "GBP",
    initialWardrobeGrant: 300,
    monthlyWardrobeDrip: 30,
    monthlyTryons: 25,
    dailyOutfitCap: 30,
  },
  pro: {
    key: "pro",
    label: "Pro",
    monthlyPriceCents: 2000,
    currency: "GBP",
    initialWardrobeGrant: 500,
    monthlyWardrobeDrip: 60,
    monthlyTryons: 100,
    dailyOutfitCap: 100,
  },
};

export const TOPUPS: Record<TopupKey, TopupDef> = {
  wardrobe_50: {
    key: "wardrobe_50",
    label: "+50 wardrobe items",
    resource: "wardrobe_add",
    amount: 50,
    priceCents: 400,
    currency: "GBP",
  },
  tryon_20: {
    key: "tryon_20",
    label: "+20 dress-on-me looks",
    resource: "tryon",
    amount: 20,
    priceCents: 600,
    currency: "GBP",
  },
};

export function getPlan(key: TierKey): PlanDef {
  return PLANS[key];
}

export function getTopup(key: TopupKey): TopupDef {
  return TOPUPS[key];
}

export function topupsForResource(resource: TopupResource): TopupDef[] {
  return Object.values(TOPUPS).filter((t) => t.resource === resource);
}

export function formatPrice(cents: number, currency: Currency = "GBP"): string {
  const symbol = currency === "GBP" ? "£" : currency + " ";
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  if (fraction === 0) return `${symbol}${whole}`;
  return `${symbol}${whole}.${fraction.toString().padStart(2, "0")}`;
}
