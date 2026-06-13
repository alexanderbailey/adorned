"use client";

import { useState } from "react";
import { extractErrorMessage } from "@/lib/error";

// Mock of a Stripe-hosted checkout. The express-wallet buttons and the card
// form are cosmetic — every "pay" path posts to the confirm route, which is
// where provisioning actually happens. Real Stripe replaces this whole screen.
export function SimulateClient({
  sessionId,
  email,
  label,
  sublabel,
  amountLabel,
  successUrl,
  cancelUrl,
}: {
  sessionId: string;
  email: string;
  label: string;
  sublabel: string;
  amountLabel: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(outcome: "success" | "decline") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, outcome }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(extractErrorMessage(text) || `HTTP ${res.status}`);
      }
      // Full navigation so the server re-renders and middleware re-evaluates.
      window.location.assign(successUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="px-5 pt-[54px] pb-4 flex items-center justify-between">
        <button
          onClick={() => window.location.assign(cancelUrl)}
          disabled={busy}
          className="text-[13px] text-mid underline underline-offset-2 disabled:opacity-40"
        >
          Cancel
        </button>
        <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          Test mode
        </span>
      </header>

      <div className="px-5 space-y-5">
        {/* Order summary */}
        <section className="bg-surface border border-hairline rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[16px] font-semibold tracking-[-0.3px]">
                {label}
              </div>
              <div className="text-[12px] text-mid mt-0.5">{sublabel}</div>
            </div>
            <div className="text-[20px] font-semibold tracking-[-0.4px] tabular-nums">
              {amountLabel}
            </div>
          </div>
          <div className="text-[11px] text-mid mt-3 pt-3 border-t border-hairline">
            {email}
          </div>
        </section>

        {/* Express wallets (cosmetic — real Stripe renders these when available) */}
        <div className="space-y-2">
          <button
            onClick={() => pay("success")}
            disabled={busy}
            className="w-full h-11 bg-charcoal text-surface text-[15px] font-semibold rounded-[6px] disabled:opacity-40"
          >
             Pay
          </button>
          <button
            onClick={() => pay("success")}
            disabled={busy}
            className="w-full h-11 bg-surface border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px] disabled:opacity-40"
          >
            Pay with Google Pay
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-mid">
          <span className="flex-1 h-px bg-hairline" />
          Or pay with card
          <span className="flex-1 h-px bg-hairline" />
        </div>

        {/* Card form (cosmetic) */}
        <section className="space-y-2">
          <FakeField placeholder="Card number" value="4242 4242 4242 4242" />
          <div className="flex gap-2">
            <FakeField placeholder="MM / YY" value="12 / 34" className="flex-1" />
            <FakeField placeholder="CVC" value="123" className="flex-1" />
          </div>
        </section>

        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={() => pay("success")}
          disabled={busy}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-semibold rounded-[6px] disabled:opacity-40"
        >
          {busy ? "Processing…" : `Pay ${amountLabel}`}
        </button>

        <button
          onClick={() => pay("decline")}
          disabled={busy}
          className="w-full text-[12px] text-mid underline underline-offset-2 disabled:opacity-40"
        >
          Simulate a declined card
        </button>

        <p className="text-[10px] text-mid text-center pb-8 leading-relaxed">
          No real payment is processed. This screen stands in for Stripe&apos;s
          hosted checkout during development.
        </p>
      </div>
    </div>
  );
}

function FakeField({
  placeholder,
  value,
  className = "",
}: {
  placeholder: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`h-11 px-3 flex items-center bg-surface border border-hairline rounded-[6px] ${className}`}
    >
      <span className="text-[14px] text-mid" aria-label={placeholder}>
        {value}
      </span>
    </div>
  );
}
