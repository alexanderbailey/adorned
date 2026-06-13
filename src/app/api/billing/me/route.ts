import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { getEntitlements } from "@/lib/billing/state";

export async function GET() {
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
  const snapshot = await getEntitlements(user.id);
  return NextResponse.json(snapshot);
}
