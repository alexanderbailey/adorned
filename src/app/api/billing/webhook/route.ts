import { NextResponse } from "next/server";
import { provisionCheckoutSession } from "@/lib/billing/checkout";

// REAL-STRIPE entry point (not used by the dummy simulator, which goes through
// the authed confirm route). This is where Stripe's server-to-server webhook
// lands. Provisioning runs through the shared provisionCheckoutSession() and is
// idempotent, so Stripe's retries are safe.
//
// TODO(stripe): replace the shared-secret check with
// stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET) and map
// the real event (checkout.session.completed) to its session id.
export async function POST(request: Request) {
  const secret = process.env.BILLING_WEBHOOK_SECRET;
  const presented = request.headers.get("x-webhook-secret");
  if (!secret || presented !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = (await request.json().catch(() => ({}))) as {
    type?: string;
    session_id?: string;
  };

  // Only completed checkouts provision. Other event types are acknowledged.
  if (event.type !== "checkout.session.completed" || !event.session_id) {
    return NextResponse.json({ received: true });
  }

  const result = await provisionCheckoutSession(event.session_id);
  if (!result.ok) {
    // Non-2xx tells Stripe to retry.
    return NextResponse.json(
      { error: result.error ?? "provision_failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ received: true });
}
