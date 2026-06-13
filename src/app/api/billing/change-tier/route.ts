import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { PLANS, type TierKey } from "@/lib/billing/plans";

// Upgrade (standard→pro) takes effect immediately; downgrade (pro→standard)
// is scheduled for the next renewal. The RPC enforces the direction logic.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const tier = (body as { tier?: string }).tier as TierKey | undefined;
  if (!tier || !(tier in PLANS)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const admin = createAdminClient();
  const pro = PLANS.pro;
  const { data, error } = await admin.rpc("schedule_tier_change", {
    p_user_id: user.id,
    p_new_tier: tier,
    p_pro_monthly_tryon: pro.monthlyTryons,
    p_pro_initial_wardrobe: pro.initialWardrobeGrant,
  });
  if (error) {
    if (error.message?.includes("no_active_subscription")) {
      return NextResponse.json(
        { error: "no_active_subscription" },
        { status: 409 }
      );
    }
    if (error.message?.includes("same_tier")) {
      return NextResponse.json({ error: "same_tier" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ subscription: data });
}
