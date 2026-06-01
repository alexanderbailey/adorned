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

export function LookbookSection({
  outfitId,
  initialLookbookUrl,
  hasBodyPhoto,
}: Props) {
  const toast = useToast();
  const [lookbookUrl, setLookbookUrl] = useState<string | null>(initialLookbookUrl);
  const [phase, setPhase] = useState<Phase>(initialLookbookUrl ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!hasBodyPhoto) return;
    setPhase("generating");
    setError(null);
    try {
      const res = await fetch(`/api/outfits/${outfitId}/visualize`, {
        method: "POST",
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

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          See it on you
        </p>
        {phase === "done" && lookbookUrl && (
          <button
            onClick={generate}
            disabled={phase !== "done" && (phase as Phase) !== "error"}
            className="text-[12px] text-charcoal underline underline-offset-2"
          >
            Regenerate
          </button>
        )}
      </div>

      {phase === "idle" && (
        <button
          onClick={generate}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] flex items-center justify-center gap-2"
        >
          <Icon name="auto_awesome" size={18} />
          Visualise on me
        </button>
      )}

      {phase === "generating" && (
        <div className="w-full aspect-[3/4] bg-surface-alt rounded-lg border border-hairline flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
          <p className="text-[13px] text-mid">Styling your lookbook…</p>
          <p className="text-[11px] text-mid">Usually 15–30 seconds.</p>
        </div>
      )}

      {phase === "done" && lookbookUrl && (
        <div className="w-full aspect-[3/4] bg-surface-alt rounded-lg overflow-hidden border border-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lookbookUrl}
            alt="AI lookbook visualization"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {phase === "error" && (
        <div className="space-y-2">
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <button
            onClick={generate}
            className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px]"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
