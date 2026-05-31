"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { removeBackground, generateThumb } from "@/lib/bg-removal";
import type { BgRemovalProgress } from "@/lib/bg-removal";
import type { ItemTags } from "@/lib/claude/tag-item";
import { uploadViaApi } from "@/lib/upload";
import { normalizeImage } from "@/lib/normalize-image";

type Stage =
  | { type: "idle" }
  | { type: "removing"; progress: number; label: string }
  | { type: "uploading" }
  | { type: "tagging" }
  | { type: "error"; message: string };

export default function AddItemPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      // Show original preview immediately
      const origUrl = URL.createObjectURL(file);
      setPreview(origUrl);

      try {
        // 0. Normalise to a Claude-safe format (HEIC/AVIF -> JPEG/PNG).
        const { file: normalized, looksLikeCutout } = await normalizeImage(file);

        // 1. Remove background — skip if the input already has transparent
        //    corners (running bg-removal on a cutout makes the edges worse).
        let cutoutBlob: Blob;
        if (looksLikeCutout) {
          setStage({ type: "removing", progress: 100, label: "Already a cutout — skipping bg removal" });
          cutoutBlob = normalized;
        } else {
          setStage({ type: "removing", progress: 0, label: "Loading model…" });
          cutoutBlob = await removeBackground(
            normalized,
            (p: BgRemovalProgress) => {
              const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
              const label =
                p.type === "loading"
                  ? `Downloading model… ${pct}%`
                  : `Removing background… ${pct}%`;
              setStage({ type: "removing", progress: pct, label });
            }
          );
        }

        // Update preview to cutout
        URL.revokeObjectURL(origUrl);
        const cutoutPreviewUrl = URL.createObjectURL(cutoutBlob);
        setPreview(cutoutPreviewUrl);

        // 2. Generate thumb
        const thumbBlob = await generateThumb(cutoutBlob);

        // 3. Upload to Supabase Storage via server route
        setStage({ type: "uploading" });
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const itemId = crypto.randomUUID();
        const cutoutExt = cutoutBlob.type === "image/png" ? "png" : "webp";
        const cutoutType = cutoutBlob.type || "image/webp";
        const origExt = normalized.type === "image/png" ? "png" : "jpg";
        const [originalUrl, cutoutUrl, thumbUrl] = await Promise.all([
          uploadViaApi("items", `${itemId}/original.${origExt}`, normalized, {
            contentType: normalized.type,
          }),
          uploadViaApi("items", `${itemId}/cutout.${cutoutExt}`, cutoutBlob, {
            contentType: cutoutType,
          }),
          uploadViaApi("items", `${itemId}/thumb.webp`, thumbBlob, {
            contentType: "image/webp",
          }).catch(() => null),
        ]);

        // 4. Call Claude Haiku to tag
        setStage({ type: "tagging" });
        const tagRes = await fetch("/api/items/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cutout_image_url: cutoutUrl }),
        });
        if (!tagRes.ok) {
          const body = await tagRes.text();
          let detail = body;
          try {
            const parsed = JSON.parse(body) as { error?: string };
            if (parsed.error) detail = parsed.error;
          } catch {}
          throw new Error(`Tagging failed: ${detail.slice(0, 200)}`);
        }
        const tags: ItemTags = await tagRes.json();

        // 5. Navigate to review page with all data in sessionStorage
        const payload = {
          itemId,
          originalImageUrl: originalUrl,
          cutoutImageUrl: cutoutUrl,
          thumbImageUrl: thumbUrl,
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
    },
    [router]
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
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
        {stage.type === "removing" && (
          <div className="w-full max-w-[280px] space-y-3">
            <div className="h-[3px] bg-hairline rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
            <p className="text-[13px] text-mid text-center">{stage.label}</p>
          </div>
        )}

        {stage.type === "uploading" && (
          <p className="text-[13px] text-mid text-center">Uploading…</p>
        )}

        {stage.type === "tagging" && (
          <div className="flex items-center gap-2 text-[13px] text-mid">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-spin">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
            </svg>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h3l2-3h8l2 3h3v11H3z"/>
                <circle cx="12" cy="13" r="3.5"/>
              </svg>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <circle cx="9" cy="10" r="1.5"/>
                <path d="M3 17l5-5 5 5 3-3 5 5"/>
              </svg>
              Choose from gallery
            </button>
            <Link
              href="/wardrobe/add/bulk"
              className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium tracking-[-0.1px] rounded-[6px] flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="7" height="7" rx="1"/>
                <rect x="14" y="4" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
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
    </div>
  );
}
