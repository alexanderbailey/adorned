"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ItemTags } from "@/lib/claude/tag-item";
import { uploadViaApi } from "@/lib/upload";
import { normalizeImage } from "@/lib/normalize-image";
import { prettifyViaApi } from "@/lib/prettify-client";
import { extractErrorMessage } from "@/lib/error";
import { Icon } from "@/components/Icon";
import { useEntitlements } from "@/lib/billing/useEntitlements";
import { OutOfCreditModal } from "@/components/billing/OutOfCreditModal";

type Stage =
  | { type: "idle" }
  | { type: "uploading" }
  | { type: "prettifying" }
  | { type: "tagging" }
  | { type: "error"; message: string };

export default function AddItemPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const { data: entitlements, refresh: refreshEntitlements } = useEntitlements();
  const [showTopupModal, setShowTopupModal] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      // Pre-check: refuse to start the upload if no wardrobe credits.
      const available = entitlements?.wardrobeCreditsTotal ?? Infinity;
      if (available < 1) {
        setShowTopupModal(true);
        return;
      }

      // Show original preview immediately
      const origUrl = URL.createObjectURL(file);
      setPreview(origUrl);

      try {
        // 0. Normalise + downsize the source photo (HEIC/AVIF -> JPEG/PNG, max 1920px).
        const { file: normalized } = await normalizeImage(file);

        // 1. Upload the normalised original to storage.
        setStage({ type: "uploading" });
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const itemId = crypto.randomUUID();
        const origExt = normalized.type === "image/png" ? "png" : "jpg";
        const originalUrl = await uploadViaApi(
          "items",
          `${itemId}/original.${origExt}`,
          normalized,
          { contentType: normalized.type }
        );

        // 2. Call Gemini prettify — bg removal + straighten + smooth creases.
        setStage({ type: "prettifying" });
        const cutoutUrl = await prettifyViaApi(itemId, originalUrl);

        // Update preview to the prettified cutout.
        URL.revokeObjectURL(origUrl);
        setPreview(cutoutUrl);

        // 3. Call Claude Haiku to tag using the prettified cutout.
        setStage({ type: "tagging" });
        const tagRes = await fetch("/api/items/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cutout_image_url: cutoutUrl }),
        });
        if (!tagRes.ok) {
          const body = await tagRes.text();
          const detail = extractErrorMessage(body) || `HTTP ${tagRes.status}`;
          throw new Error(`Tagging failed: ${detail.slice(0, 200)}`);
        }
        const tags: ItemTags = await tagRes.json();

        // 4. Navigate to review page with all data in sessionStorage.
        const payload = {
          itemId,
          originalImageUrl: originalUrl,
          cutoutImageUrl: cutoutUrl,
          thumbImageUrl: null,
          tags,
        };
        sessionStorage.setItem("adorned:add-review", JSON.stringify(payload));
        router.push("/wardrobe/add/review");
      } catch (err) {
        setStage({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      }
      void refreshEntitlements();
    },
    [router, entitlements, refreshEntitlements]
  );

  const idle = stage.type === "idle";
  const busy = stage.type !== "idle" && stage.type !== "error";

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
        <Link
          href="/wardrobe"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <Icon name="close" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">
          Add to wardrobe
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Preview area */}
        {preview && (
          <div className="w-full max-w-[280px] aspect-[3/4] bg-surface-alt rounded flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Item preview" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Progress states */}
        {stage.type === "uploading" && (
          <p className="text-[13px] text-mid text-center">Uploading…</p>
        )}

        {stage.type === "prettifying" && (
          <div className="flex flex-col items-center gap-2 text-[13px] text-mid">
            <Icon name="auto_awesome" size={14} className="text-accent animate-spin" />
            <p>Prettifying — usually 10–20 seconds.</p>
          </div>
        )}

        {stage.type === "tagging" && (
          <div className="flex items-center gap-2 text-[13px] text-mid">
            <Icon name="auto_awesome" size={14} className="text-accent animate-spin" />
            Identifying item…
          </div>
        )}

        {stage.type === "error" && (
          <div className="space-y-3 text-center">
            <p className="text-[14px] text-danger">{stage.message}</p>
            <button
              onClick={() => { setStage({ type: "idle" }); setPreview(null); }}
              className="text-[13px] text-mid underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Upload buttons */}
        {idle && (
          <div className="w-full max-w-[280px] space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium tracking-[-0.1px] rounded-[6px] flex items-center justify-center gap-2"
            >
              <Icon name="photo_camera" size={20} />
              Take photo
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute("capture");
                  fileRef.current.click();
                }
              }}
              className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium tracking-[-0.1px] rounded-[6px] flex items-center justify-center gap-2"
            >
              <Icon name="photo_library" size={20} />
              Choose from gallery
            </button>
            <Link
              href="/wardrobe/add/bulk"
              className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium tracking-[-0.1px] rounded-[6px] flex items-center justify-center gap-2"
            >
              <Icon name="grid_view" size={20} />
              Add many
            </Link>
          </div>
        )}

        {busy && !preview && (
          <div className="w-full max-w-[280px] aspect-[3/4] bg-surface-alt rounded shimmer" />
        )}
      </div>

      {/* Hidden file input — camera capture */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so same file can be re-selected
          e.target.value = "";
        }}
      />

      {showTopupModal && (
        <OutOfCreditModal
          resource="wardrobe_add"
          onClose={() => setShowTopupModal(false)}
        />
      )}
    </div>
  );
}
