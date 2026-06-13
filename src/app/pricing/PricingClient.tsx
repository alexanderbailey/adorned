"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, formatPrice, type TierKey } from "@/lib/billing/plans";
import { useToast } from "@/components/Toast";
import { extractErrorMessage } from "@/lib/error";

export function PricingClient({
  userEmail,
  isResubscribe,
}: {
  userEmail: string;
  isResubscribe: boolean;
}) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  // Surface the outcome when Stripe (the simulator) returns to /pricing.
  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast.show("Checkout cancelled", "info");
    }
  }, [searchParams, toast]);

  // Stand-in for redirecting to a Stripe Checkout Session: create the session
  // server-side, then send the browser to the returned checkout URL.
  async function startCheckout(tier: TierKey) {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", tier }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(extractErrorMessage(body) || `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "Could not start checkout",
        "error"
      );
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="px-5 pt-[54px] pb-4">
        <h1 className="text-[28px] font-semibold tracking-[-0.6px] leading-[1.1]">
          Choose your plan
        </h1>
        <p className="text-[13px] text-mid mt-2">{userEmail}</p>
        {isResubscribe && (
          <p className="text-[12px] text-mid mt-3 bg-surface-alt border border-hairline rounded p-2.5">
            Welcome back — re-subscribing gives you this month&apos;s wardrobe
            additions, not the full new-user grant.
          </p>
        )}
      </header>

      <div className="px-5 pb-8 space-y-3">
        <PlanCard
          tier="standard"
          isResubscribe={isResubscribe}
          busy={busy}
          onPick={() => startCheckout("standard")}
        />
        <PlanCard
          tier="pro"
          isResubscribe={isResubscribe}
          busy={busy}
          onPick={() => startCheckout("pro")}
          recommended
        />
        <p className="text-[11px] text-mid pt-3 text-center leading-relaxed">
          * Fair-use limits apply to daily styling. Top-up packs are available
          for dress-on-me and wardrobe expansion. Cancel anytime; you keep
          access until the end of the period.
        </p>
        <p className="text-[10px] text-mid pt-1 text-center">
          No real payment is processed — this is a development build.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  isResubscribe,
  busy,
  onPick,
  recommended,
}: {
  tier: TierKey;
  isResubscribe: boolean;
  busy: boolean;
  onPick: () => void;
  recommended?: boolean;
}) {
  const plan = PLANS[tier];
  const wardrobeStart = isResubscribe
    ? plan.monthlyWardrobeDrip
    : plan.initialWardrobeGrant;

  return (
    <div
      className={`rounded-lg border p-4 bg-surface ${
        recommended ? "border-charcoal" : "border-hairline"
      }`}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[18px] font-semibold tracking-[-0.3px]">
            {plan.label}
          </h2>
          {recommended && (
            <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Power user
            </span>
          )}
        </div>
        <div className="text-[20px] font-semibold tracking-[-0.4px]">
          {formatPrice(plan.monthlyPriceCents, plan.currency)}
          <span className="text-[12px] font-normal text-mid">/mo</span>
        </div>
      </div>

      <ul className="text-[13px] leading-[1.7] text-charcoal space-y-1 mb-4">
        <li>
          Add <strong>{wardrobeStart}</strong> wardrobe items
          {isResubscribe ? " this month" : " to start"}
          {!isResubscribe && (
            <span className="text-mid">
              {" "}
              + {plan.monthlyWardrobeDrip} new each month
            </span>
          )}
        </li>
        <li>
          <strong>{plan.monthlyTryons}</strong> dress-on-me looks per month
        </li>
        <li>
          {tier === "pro"
            ? "Unlimited everyday styling, no daily caps"
            : "Unlimited everyday styling*"}
        </li>
      </ul>

      <button
        onClick={onPick}
        disabled={busy}
        className={`w-full h-11 text-[14px] font-medium rounded-[6px] disabled:opacity-40 ${
          recommended
            ? "bg-charcoal text-surface"
            : "border border-border-strong text-charcoal"
        }`}
      >
        Choose {plan.label}
      </button>
    </div>
  );
}
