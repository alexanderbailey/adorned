import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import {
  getCheckoutSession,
  provisionCheckoutSession,
} from "@/lib/billing/checkout";

// DUMMY-ONLY confirm entry. The simulator page calls this when the user
// "pays" — the browser can't sign a Stripe webhook, so we authenticate the
// user instead and verify the session belongs to them, then provision via the
// shared provisionCheckoutSession() (the same function the real webhook calls).
//
// When real Stripe is wired: delete this route and /checkout/simulate. Stripe
// will hit /api/billing/webhook (signature-verified) which provisions through
// the very same function.
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

  const body = (await request.json().catch(() => ({}))) as {
    session?: string;
    outcome?: string;
  };
  if (!body.session) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  // Ownership check — a user can only confirm their own session.
  const session = await getCheckoutSession(body.session, user.id);
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  // The simulator can request a declined payment to exercise the failure path.
  if (body.outcome === "decline") {
    return NextResponse.json({ error: "card_declined" }, { status: 402 });
  }

  const result = await provisionCheckoutSession(body.session);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "provision_failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    mode: result.mode,
    tier: result.tier,
  });
}
