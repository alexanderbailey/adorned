import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type TierKey } from "./plans";

export interface ConsumeOk {
  ok: true;
  source: "subscription" | "topup";
  topupId?: string;
}
export interface ConsumeFail {
  ok: false;
  error:
    | "no_active_subscription"
    | "no_credits"
    | "daily_cap_reached"
    | "rpc_error";
  status: 401 | 402 | 403 | 429 | 500;
  message?: string;
  // Daily cap context
  cap?: number;
  todayCount?: number;
}

// Verifies the user has an active subscription. Use on AI endpoints that
// don't consume credits (onboarding-only AI calls, item tagging after
// prettify already charged a credit).
export async function assertActiveSubscription(
  userId: string
): Promise<{ ok: true; tier: TierKey } | { ok: false; response: Response }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.status !== "active") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "no_active_subscription" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, tier: data.tier as TierKey };
}

export async function consumeTryon(userId: string): Promise<ConsumeOk | ConsumeFail> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_tryon", {
    p_user_id: userId,
  });
  if (error)
    return { ok: false, error: "rpc_error", status: 500, message: error.message };
  const r = data as {
    ok: boolean;
    source?: string;
    topup_id?: string;
    error?: string;
  };
  if (r.ok && r.source) {
    return {
      ok: true,
      source: r.source as ConsumeOk["source"],
      topupId: r.topup_id,
    };
  }
  if (r.error === "no_active_subscription") {
    return { ok: false, error: "no_active_subscription", status: 403 };
  }
  return { ok: false, error: "no_credits", status: 402 };
}

export async function refundTryon(
  userId: string,
  source: "subscription" | "topup",
  topupId?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("refund_tryon", {
    p_user_id: userId,
    p_source: source,
    p_topup_id: topupId ?? null,
  });
}

export async function consumeWardrobe(userId: string): Promise<ConsumeOk | ConsumeFail> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_wardrobe", {
    p_user_id: userId,
  });
  if (error)
    return { ok: false, error: "rpc_error", status: 500, message: error.message };
  const r = data as {
    ok: boolean;
    source?: string;
    topup_id?: string;
    error?: string;
  };
  if (r.ok && r.source) {
    return {
      ok: true,
      source: r.source as ConsumeOk["source"],
      topupId: r.topup_id,
    };
  }
  if (r.error === "no_active_subscription") {
    return { ok: false, error: "no_active_subscription", status: 403 };
  }
  return { ok: false, error: "no_credits", status: 402 };
}

export async function refundWardrobe(
  userId: string,
  source: "subscription" | "topup",
  topupId?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("refund_wardrobe", {
    p_user_id: userId,
    p_source: source,
    p_topup_id: topupId ?? null,
  });
}

// Daily cap is hidden from the user — never expose the count in API responses.
// Server returns 429 with a generic "daily_cap_reached" the client renders as
// a cooldown screen with the Pro upgrade nudge (no top-up CTA).
export async function consumeOutfitWithCap(
  userId: string
): Promise<{ ok: true } | ConsumeFail> {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (sub?.status !== "active") {
    return { ok: false, error: "no_active_subscription", status: 403 };
  }
  const cap = PLANS[sub.tier as TierKey].dailyOutfitCap;

  const { data, error } = await admin.rpc("consume_outfit_with_cap", {
    p_user_id: userId,
    p_cap: cap,
  });
  if (error)
    return { ok: false, error: "rpc_error", status: 500, message: error.message };
  const r = data as {
    ok: boolean;
    error?: string;
    cap?: number;
    today_count?: number;
  };
  if (r.ok) return { ok: true };
  if (r.error === "no_active_subscription") {
    return { ok: false, error: "no_active_subscription", status: 403 };
  }
  return {
    ok: false,
    error: "daily_cap_reached",
    status: 429,
    cap: r.cap,
    todayCount: r.today_count,
  };
}

export async function refundOutfit(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("refund_outfit", { p_user_id: userId });
}

// Standard helper to convert a ConsumeFail to a NextResponse.
export function gateErrorResponse(fail: ConsumeFail): Response {
  const body: Record<string, unknown> = { error: fail.error };
  if (fail.message) body.message = fail.message;
  if (fail.cap !== undefined) body.cap = fail.cap;
  return NextResponse.json(body, { status: fail.status });
}
