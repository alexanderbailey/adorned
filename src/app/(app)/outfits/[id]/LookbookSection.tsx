"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

interface Props {
  outfitId: string;
  initialLookbookUrl: string | null;
  hasBodyPhoto: boolean;
}

type Phase = "idle" | "generating" | "done" | "error";
type Quality = "standard" | "high";

// When the token system lands, swap the `cost` strings for a real currency
// display. Order here is the order they appear in the UI.
const QUALITY_OPTIONS: { value: Quality; label: string; cost: string }[] = [
  { value: "standard", label: "Standard",     cost: "Quick" },
  { value: "high",     label: "High quality", cost: "Slower, sharper" },
];

export function LookbookSection({
  outfitId,
  initialLookbookUrl,
  hasBodyPhoto,
}: Props) {
  const toast = useToast();
  const [lookbookUrl, setLookbookUrl] = useState<string | null>(initialLookbookUrl);
  const [phase, setPhase] = useState<Phase>(initialLookbookUrl ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [activeQuality, setActiveQuality] = useState<Quality | null>(null);

  async function generate(quality: Quality) {
    if (!hasBodyPhoto) return;
    setPhase("generating");
    setActiveQuality(quality);
    setError(null);
    try {
      const res = await fetch(`/api/outfits/${outfitId}/visualize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try {
          const parsed = JSON.parse(body) as { error?: string };
          if (parsed.error) detail = parsed.error;
        } catch {}
        throw new Error(detail.slice(0, 200));
      }
      const { lookbook_url } = (await res.json()) as { lookbook_url: string };
      setLookbookUrl(lookbook_url);
      setPhase("done");
      toast.show("Lookbook ready", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      setPhase("error");
      toast.show(msg, "error");
    }
  }

  if (!hasBodyPhoto) {
    return (
      <section className="p-4 bg-surface border border-hairline rounded-lg">
        <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2">
          See it on you
        </p>
        <p className="text-[13px] leading-[1.55] text-charcoal">
          Add a body reference photo in your{" "}
          <Link
            href="/onboarding/body"
            className="underline underline-offset-2"
          >
            profile
          </Link>{" "}
          first, then we can visualise this outfit on you.
        </p>
      </section>
    );
  }

  const showButtons = phase === "idle" || phase === "done" || phase === "error";

  return (
    <section className="space-y-2.5">
      <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
        See it on you
      </p>

      {phase === "generating" && (
        <div className="w-full aspect-[3/4] bg-surface-alt rounded-lg border border-hairline flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
          <p className="text-[13px] text-mid">
            Styling your lookbook
            {activeQuality === "high" ? " (high quality)" : ""}…
          </p>
          <p className="text-[11px] text-mid">
            {activeQuality === "high" ? "Usually 30–60 seconds." : "Usually 15–30 seconds."}
          </p>
        </div>
      )}

      {(phase === "done" || phase === "error") && lookbookUrl && (
        <div className="w-full aspect-[3/4] bg-surface-alt rounded-lg overflow-hidden border border-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lookbookUrl}
            alt="AI lookbook visualization"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {phase === "error" && error && (
        <p className="text-[13px] text-danger">{error}</p>
      )}

      {showButtons && (
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => generate(opt.value)}
              className="h-14 px-3 border border-border-strong text-charcoal rounded-[6px] flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-surface-alt"
            >
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                <Icon name="auto_awesome" size={14} />
                {opt.label}
              </span>
              <span className="text-[10px] text-mid tracking-[0.4px] uppercase">
                {opt.cost}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
