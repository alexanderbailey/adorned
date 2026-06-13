import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getEntitlements } from "@/lib/billing/state";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entitlements = await getEntitlements(user.id);
  if (!entitlements.hasActiveSubscription) {
    redirect("/pricing");
  }

  // Pull full top-up history (used for the receipts list).
  const admin = createAdminClient();
  const { data: history } = await admin
    .from("topup_purchases")
    .select("id, resource, amount_granted, amount_remaining, price_cents, currency, purchased_at")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false });

  return (
    <BillingClient
      userEmail={user.email ?? ""}
      initialEntitlements={entitlements}
      topupHistory={history ?? []}
    />
  );
}
