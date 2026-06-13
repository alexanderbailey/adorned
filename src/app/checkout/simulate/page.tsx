import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCheckoutSession } from "@/lib/billing/checkout";
import { PLANS, TOPUPS, formatPrice, type TopupKey } from "@/lib/billing/plans";
import { SimulateClient } from "./SimulateClient";

// DUMMY-ONLY checkout surface — the stand-in for Stripe's hosted checkout page.
// Deleted when real Stripe is wired (we'll redirect to session.url instead).
export default async function SimulateCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; return_to?: string }>;
}) {
  const { session: sessionId, return_to } = await searchParams;
  if (!sessionId) redirect("/pricing");
  // Only honour a local absolute path (mirrors the session route's guard).
  const safeReturn =
    return_to && /^\/(?!\/)/.test(return_to) ? return_to : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getCheckoutSession(sessionId, user.id);
  // Unknown / not-owned / already-paid sessions bounce back to pricing.
  if (!session || session.status !== "pending") redirect("/pricing");

  const label =
    session.mode === "subscription"
      ? `${PLANS[session.tier as "standard" | "pro"].label} plan`
      : TOPUPS[session.pack as TopupKey].label;
  const sublabel =
    session.mode === "subscription"
      ? `${formatPrice(session.amount_cents, "GBP")} / month`
      : `${formatPrice(session.amount_cents, "GBP")} one-off`;

  // success_url / cancel_url, mirroring Stripe's redirect targets. A new
  // subscription returns to the app root (middleware routes to onboarding or
  // home); a top-up returns to the billing page where balances live.
  const successUrl =
    safeReturn ??
    (session.mode === "subscription" ? "/?checkout=success" : "/billing?checkout=topup");
  const cancelUrl =
    safeReturn ??
    (session.mode === "subscription"
      ? "/pricing?checkout=cancelled"
      : "/billing?checkout=cancelled");

  return (
    <SimulateClient
      sessionId={session.id}
      email={user.email ?? ""}
      label={label}
      sublabel={sublabel}
      amountLabel={formatPrice(session.amount_cents, "GBP")}
      successUrl={successUrl}
      cancelUrl={cancelUrl}
    />
  );
}
