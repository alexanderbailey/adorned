"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import { prettifyViaApi } from "@/lib/prettify-client";

interface Props {
  itemId: string;
  originalImageUrl: string;
}

export function RegenerateCutout({ itemId, originalImageUrl }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRegenerate() {
    setBusy(true);
    try {
      const newUrl = await prettifyViaApi(
        itemId,
        originalImageUrl,
        instructions.trim() || undefined
      );
      // Persist the new cutout URL on the item row so the gallery + detail
      // see it next render.
      const supabase = createClient();
      const { error } = await supabase
        .from("items")
        .update({ cutout_image_url: newUrl })
        .eq("id", itemId);
      if (error) throw error;
      toast.show("Item re-prettified", "success");
      setOpen(false);
      setInstructions("");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.show(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-canvas/90 backdrop-blur rounded-full text-charcoal shadow-sm"
        aria-label="Regenerate cutout"
      >
        <Icon name="auto_awesome" size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-charcoal/30"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full bg-canvas rounded-t-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 border-b border-hairline flex items-center justify-between">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="text-[13px] text-mid disabled:opacity-40"
              >
                Cancel
              </button>
              <span className="text-[15px] font-semibold tracking-[-0.2px]">
                Regenerate cutout
              </span>
              <button
                onClick={handleRegenerate}
                disabled={busy}
                className="text-[13px] text-charcoal font-medium disabled:opacity-40"
              >
                {busy ? "Working…" : "Regenerate"}
              </button>
            </div>
            <div className="px-5 py-5 space-y-2">
              <label className="block text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Specific instructions (optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. This is a skirt, not shorts. Or: keep the heel visible. Or: the colour is navy, not black."
                className="w-full p-3 text-[14px] leading-[1.55] text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal resize-y"
                disabled={busy}
              />
              <p className="text-[11px] text-mid">
                Leave blank to re-run the standard prompt. Anything you type
                here is appended just for this regeneration — it doesn&apos;t
                persist on the item.
              </p>
              <p className="text-[11px] text-mid">
                Takes around 30 seconds. Replaces the current cutout image.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
