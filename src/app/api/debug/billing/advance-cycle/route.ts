import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { advanceUserCycle } from "@/lib/billing/cycle";

// Debug-only: forces the current user's subscription to advance one cycle
// regardless of current_period_end. Equivalent to "pretend a month passed".
// Fast-forwards period_end to now first, then runs the renewal RPC.
export async function POST() {
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

  const admin = createAdminClient();
  await admin
    .from("user_subscriptions")
    .update({ current_period_end: new Date().toISOString() })
    .eq("user_id", user.id);

  const result = await advanceUserCycle(user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ subscription: result.subscription });
}
