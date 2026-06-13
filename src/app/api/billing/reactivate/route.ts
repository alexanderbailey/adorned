import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";

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
  const { data, error } = await admin.rpc("reactivate_subscription", {
    p_user_id: user.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // The RPC only matches an active, pending-cancellation subscription. If the
  // period already ended (cron flipped status to 'cancelled') it updates no
  // row — don't report a phantom success the client renders as "resumed".
  if (!data || !(data as { user_id?: string }).user_id) {
    return NextResponse.json(
      { error: "no_active_subscription" },
      { status: 409 }
    );
  }
  return NextResponse.json({ subscription: data });
}
