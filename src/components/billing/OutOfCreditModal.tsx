"use client";

import { useState } from "react";
import Link from "next/link";
import { topupsForResource, formatPrice, type TopupResource } from "@/lib/billing/plans";
import { useToast } from "@/components/Toast";
import { extractErrorMessage } from "@/lib/error";

interface Props {
  resource: TopupResource;
  onClose: () => void;
}

// Renders a bottom-sheet modal offering top-up packs for the depleted resource.
// Used by /generate (try-ons) and the bulk wardrobe add flow. Buying sends the
// user to checkout and returns them to this page afterwards (hosted checkout
// navigates away, so the original action is re-run manually on return).
export function OutOfCreditModal({ resource, onClose }: Props) {
  const toast = useToast();
  const packs = topupsForResource(resource);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const title =
    resource === "tryon" ? "Out of dress-on-me looks" : "Out of wardrobe additions";
  const body =
    resource === "tryon"
      ? "You've used all your monthly looks and top-ups. Add more or upgrade your plan."
      : "You've used all your wardrobe-addition credits. Buy a pack to keep adding items.";

  async function buy(packKey: string) {
    setBusyKey(packKey);
    try {
      const returnTo = window.location.pathname + window.location.search;
      const res = await fetch("/api/billing/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "payment", pack: packKey, returnTo }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(extractErrorMessage(text) || `HTTP ${res.status}`);
      }
      const { url } = (await res.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Top-up failed", "error");
      setBusyKey(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={busyKey ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-t-lg sm:rounded-lg w-full sm:max-w-sm border-t border-hairline sm:border p-5 space-y-4 pb-safe"
      >
        <div>
          <h3 className="text-[18px] font-semibold tracking-[-0.3px]">{title}</h3>
          <p className="text-[13px] text-mid mt-1.5 leading-[1.5]">{body}</p>
        </div>

        <div className="space-y-2">
          {packs.map((pack) => (
            <button
              key={pack.key}
              disabled={!!busyKey}
              onClick={() => buy(pack.key)}
              className="w-full border border-border-strong rounded-[6px] p-3 flex items-center justify-between text-charcoal disabled:opacity-40"
            >
              <span className="text-[14px]">{pack.label}</span>
              <span className="text-[14px] font-medium">
                {busyKey === pack.key
                  ? "…"
                  : formatPrice(pack.priceCents, pack.currency)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            disabled={!!busyKey}
            onClick={onClose}
            className="flex-1 h-10 text-[13px] text-mid disabled:opacity-40"
          >
            Not now
          </button>
          <Link
            href="/billing"
            className="flex-1 h-10 flex items-center justify-center text-[13px] text-charcoal underline underline-offset-2"
          >
            Manage plan
          </Link>
        </div>
      </div>
    </div>
  );
}
