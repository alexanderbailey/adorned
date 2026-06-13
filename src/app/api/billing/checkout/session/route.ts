import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { createCheckoutSession } from "@/lib/billing/checkout";
import type { TierKey, TopupKey } from "@/lib/billing/plans";

// Stand-in for stripe.checkout.sessions.create. Body:
//   { mode: 'subscription', tier }  |  { mode: 'payment', pack }
// Returns a checkout URL to send the user to. Today that's the local simulator;
// with real Stripe it becomes the hosted session.url.
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
    mode?: string;
    tier?: string;
    pack?: string;
    returnTo?: string;
  };
  if (body.mode !== "subscription" && body.mode !== "payment") {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  const result = await createCheckoutSession({
    userId: user.id,
    mode: body.mode,
    tier: body.tier as TierKey | undefined,
    pack: body.pack as TopupKey | undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Optional same-site return target (e.g. send the user back to /generate
  // after topping up). Reject anything that isn't a local absolute path to
  // avoid an open redirect.
  const returnTo =
    body.returnTo && /^\/(?!\/)/.test(body.returnTo) ? body.returnTo : null;
  let url = `/checkout/simulate?session=${result.sessionId}`;
  if (returnTo) url += `&return_to=${encodeURIComponent(returnTo)}`;

  return NextResponse.json({ url });
}
