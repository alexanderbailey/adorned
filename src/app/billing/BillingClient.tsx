"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PLANS,
  TOPUPS,
  formatPrice,
  type TopupKey,
  type TierKey,
} from "@/lib/billing/plans";
import type { EntitlementsSnapshot } from "@/lib/billing/state";
import { useToast } from "@/components/Toast";
import { extractErrorMessage } from "@/lib/error";

interface TopupRow {
  id: string;
  resource: "tryon" | "wardrobe_add";
  amount_granted: number;
  amount_remaining: number;
  price_cents: number;
  currency: string;
  purchased_at: string;
}

export function BillingClient({
  userEmail,
  initialEntitlements,
  topupHistory,
}: {
  userEmail: string;
  initialEntitlements: EntitlementsSnapshot;
  topupHistory: TopupRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [confirmTopup, setConfirmTopup] = useState<TopupKey | null>(null);
  const [confirmTier, setConfirmTier] = useState<TierKey | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Surface the outcome when checkout (the simulator) returns to /billing.
  useEffect(() => {
    const status = searchParams.get("checkout");
    if (status === "topup") toast.show("Top-up added", "success");
    else if (status === "cancelled") toast.show("Checkout cancelled", "info");
  }, [searchParams, toast]);

  const e = initialEntitlements;
  const currentPlan = e.tier ? PLANS[e.tier] : null;
  const periodEndLabel = e.currentPeriodEnd
    ? new Date(e.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  async function post(path: string, body?: unknown, successMsg?: string) {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(extractErrorMessage(text) || `HTTP ${res.status}`);
      }
      if (successMsg) toast.show(successMsg, "success");
      router.refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
      setConfirmTopup(null);
      setConfirmTier(null);
      setConfirmCancel(false);
    }
  }

  // Top-ups go through the same hosted-checkout flow as subscriptions: create a
  // session, then redirect the browser to the checkout URL.
  async function startTopupCheckout(pack: TopupKey) {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "payment", pack }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(extractErrorMessage(text) || `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "Could not start checkout",
        "error"
      );
      setBusy(false);
      setConfirmTopup(null);
    }
  }

  const otherTier: TierKey = e.tier === "pro" ? "standard" : "pro";
  const isUpgrade = otherTier === "pro";

  return (
    <div className="min-h-screen bg-canvas flex flex-col pb-12">
      <header className="px-5 pt-[54px] pb-3 flex items-baseline justify-between">
        <h1 className="text-[28px] font-semibold tracking-[-0.6px] leading-none">
          Billing
        </h1>
        <Link
          href="/"
          className="text-[13px] text-mid underline underline-offset-2"
        >
          Done
        </Link>
      </header>
      <p className="px-5 text-[12px] text-mid">{userEmail}</p>

      <div className="px-5 mt-5 space-y-5">
        {/* Plan summary */}
        <section className="bg-surface border border-hairline rounded-lg p-4">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Plan
            </h2>
            {e.cancelAtPeriodEnd && (
              <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-danger">
                Cancels {periodEndLabel}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-semibold tracking-[-0.4px]">
              {currentPlan?.label}
            </span>
            <span className="text-[14px] text-mid">
              {currentPlan
                ? `${formatPrice(currentPlan.monthlyPriceCents, currentPlan.currency)}/mo`
                : ""}
            </span>
          </div>
          <p className="text-[12px] text-mid mt-2">
            {e.cancelAtPeriodEnd
              ? `Access ends on ${periodEndLabel}.`
              : `Renews on ${periodEndLabel}.`}
          </p>
          {e.pendingTierChange && (
            <p className="text-[12px] text-mid mt-1">
              Switching to <strong>{PLANS[e.pendingTierChange].label}</strong>{" "}
              on {periodEndLabel}.
            </p>
          )}

          <div className="flex gap-2 mt-3">
            {!e.cancelAtPeriodEnd ? (
              <>
                <button
                  disabled={busy}
                  onClick={() => setConfirmTier(otherTier)}
                  className="flex-1 h-10 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px] disabled:opacity-40"
                >
                  {isUpgrade ? "Upgrade to Pro" : "Switch to Standard"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => setConfirmCancel(true)}
                  className="flex-1 h-10 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px] disabled:opacity-40"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                disabled={busy}
                onClick={() => post("/api/billing/reactivate", undefined, "Subscription resumed")}
                className="flex-1 h-10 bg-charcoal text-surface text-[13px] font-medium rounded-[6px] disabled:opacity-40"
              >
                Resume subscription
              </button>
            )}
          </div>
        </section>

        {/* Balances */}
        <section>
          <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2 px-1">
            Balances
          </h2>
          <div className="space-y-2">
            <BalanceRow
              label="Dress-on-me looks"
              sub={e.subTryonCredits}
              topup={e.topupTryonBalance}
              perMonth={currentPlan?.monthlyTryons ?? 0}
            />
            <BalanceRow
              label="Wardrobe additions"
              sub={e.subWardrobeCredits}
              topup={e.topupWardrobeBalance}
              perMonth={currentPlan?.monthlyWardrobeDrip ?? 0}
              drip
            />
          </div>
        </section>

        {/* Top-up packs */}
        <section>
          <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2 px-1">
            Top-up packs
          </h2>
          <div className="space-y-2">
            {Object.values(TOPUPS).map((pack) => (
              <button
                key={pack.key}
                disabled={busy}
                onClick={() => setConfirmTopup(pack.key)}
                className="w-full bg-surface border border-hairline rounded-lg p-3 flex items-center justify-between disabled:opacity-40"
              >
                <span className="text-[14px] text-charcoal">{pack.label}</span>
                <span className="text-[14px] font-medium text-charcoal">
                  {formatPrice(pack.priceCents, pack.currency)}
                </span>
              </button>
            ))}
            <p className="text-[11px] text-mid px-1 pt-1">
              Top-up packs don&apos;t expire. They&apos;re used after your
              monthly credits run out.
            </p>
          </div>
        </section>

        {/* History */}
        {topupHistory.length > 0 && (
          <section>
            <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2 px-1">
              Purchases
            </h2>
            <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
              {topupHistory.map((p) => (
                <div key={p.id} className="px-3 py-2.5 flex items-center justify-between text-[13px] border-t border-hairline first:border-t-0">
                  <div>
                    <div className="text-charcoal">
                      +{p.amount_granted}{" "}
                      {p.resource === "tryon" ? "dress-on-me" : "wardrobe"}
                    </div>
                    <div className="text-[11px] text-mid">
                      {new Date(p.purchased_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {p.amount_remaining > 0
                        ? `${p.amount_remaining} left`
                        : "used"}
                    </div>
                  </div>
                  <span className="text-mid font-mono tabular-nums">
                    {formatPrice(p.price_cents, p.currency as "GBP")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Debug-only: advance billing cycle */}
        <section>
          <button
            disabled={busy}
            onClick={() =>
              post(
                "/api/debug/billing/advance-cycle",
                undefined,
                "Cycle advanced"
              )
            }
            className="w-full h-10 border border-hairline text-mid text-[12px] rounded-[6px] disabled:opacity-40"
          >
            Debug · Advance one billing cycle
          </button>
        </section>
      </div>

      {confirmTopup && (
        <Modal
          title={`Buy ${TOPUPS[confirmTopup].label}?`}
          body={`${formatPrice(TOPUPS[confirmTopup].priceCents, TOPUPS[confirmTopup].currency)}. You'll be taken to checkout to complete the purchase.`}
          confirmLabel="Continue to checkout"
          busy={busy}
          onCancel={() => setConfirmTopup(null)}
          onConfirm={() => startTopupCheckout(confirmTopup)}
        />
      )}

      {confirmTier && (
        <Modal
          title={isUpgrade ? "Upgrade to Pro?" : "Switch to Standard?"}
          body={
            isUpgrade
              ? "Pro takes effect immediately. Your dress-on-me and wardrobe credits will be topped up to Pro's monthly grant."
              : "Standard will take effect at your next renewal. You'll keep Pro until then."
          }
          confirmLabel={isUpgrade ? "Upgrade" : "Schedule downgrade"}
          busy={busy}
          onCancel={() => setConfirmTier(null)}
          onConfirm={() =>
            post(
              "/api/billing/change-tier",
              { tier: confirmTier },
              isUpgrade ? "Upgraded to Pro" : "Downgrade scheduled"
            )
          }
        />
      )}

      {confirmCancel && (
        <Modal
          title="Cancel subscription?"
          body={`You'll keep full access until ${periodEndLabel}. Your top-up packs will remain — they don't expire.`}
          confirmLabel="Cancel subscription"
          danger
          busy={busy}
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => post("/api/billing/cancel", undefined, "Cancelled — runs until period end")}
        />
      )}
    </div>
  );
}

function BalanceRow({
  label,
  sub,
  topup,
  perMonth,
  drip,
}: {
  label: string;
  sub: number;
  topup: number;
  perMonth: number;
  drip?: boolean;
}) {
  const total = sub + topup;
  return (
    <div className="bg-surface border border-hairline rounded-lg p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[14px] text-charcoal">{label}</span>
        <span className="text-[20px] font-semibold tracking-[-0.4px] tabular-nums">
          {total}
        </span>
      </div>
      <div className="text-[11px] text-mid mt-1 font-mono tabular-nums">
        Subscription: {sub} · Top-ups: {topup}
      </div>
      <div className="text-[11px] text-mid mt-0.5">
        {drip
          ? `+${perMonth} added each month`
          : `Resets to ${perMonth} each month`}
      </div>
    </div>
  );
}

function Modal({
  title,
  body,
  confirmLabel,
  busy,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={busy ? undefined : onCancel}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="bg-surface rounded-t-lg sm:rounded-lg w-full sm:max-w-sm border-t border-hairline sm:border p-5 space-y-4 pb-safe"
      >
        <div>
          <h3 className="text-[18px] font-semibold tracking-[-0.3px]">{title}</h3>
          <p className="text-[13px] text-mid mt-1.5 leading-[1.5]">{body}</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={onCancel}
            className="flex-1 h-11 border border-border-strong text-charcoal text-[14px] font-medium rounded-[6px] disabled:opacity-40"
          >
            Back
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className={`flex-1 h-11 text-[14px] font-medium rounded-[6px] disabled:opacity-40 ${
              danger
                ? "border border-danger text-danger"
                : "bg-charcoal text-surface"
            }`}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
