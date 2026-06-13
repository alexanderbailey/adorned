import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PricingClient } from "./PricingClient";
import { getEntitlements } from "@/lib/billing/state";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entitlements = await getEntitlements(user.id);

  // Already subscribed? Send them to /billing for management instead.
  if (entitlements.hasActiveSubscription) {
    redirect("/billing");
  }

  // Re-subscribers (after cancellation) won't see the initial wardrobe grant
  // — they get the monthly drip amount instead. Surface that on the page so
  // it isn't a surprise.
  const isResubscribe = entitlements.tier !== null;

  return <PricingClient userEmail={user.email ?? ""} isResubscribe={isResubscribe} />;
}
