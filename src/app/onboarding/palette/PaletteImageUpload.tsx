"use client";

import { useEffect, useRef, useState } from "react";
import type { PaletteSwatch } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { clsx } from "clsx";
import { extractErrorMessage } from "@/lib/error";

type Phase = "idle" | "preview" | "extracting" | "review" | "error";

export function PaletteImageUpload({
  existingSwatches,
  onImport,
}: {
  existingSwatches: PaletteSwatch[];
  onImport: (swatches: PaletteSwatch[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<PaletteSwatch[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Accept paste of an image from clipboard.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (phase !== "idle") return;
      const items = e.clipboardData?.items ?? [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            handleFile(f);
            e.preventDefault();
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image.");
      setPhase("error");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhase("extracting");
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/palette/extract", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.text();
        const detail = extractErrorMessage(body) || `HTTP ${res.status}`;
        throw new Error(detail.slice(0, 200));
      }
      const { swatches } = (await res.json()) as { swatches: PaletteSwatch[] };
      if (!swatches || swatches.length === 0) {
        throw new Error("Couldn't find any colours in this image. Try a clearer palette image.");
      }
      setExtracted(swatches);
      setSelected(new Set(swatches.map((_, i) => i)));
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
      setPhase("error");
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function commit() {
    const existingHexes = new Set(existingSwatches.map((s) => s.hex.toLowerCase()));
    const additions = extracted.filter(
      (s, i) => selected.has(i) && !existingHexes.has(s.hex.toLowerCase())
    );
    onImport(additions);
    reset();
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setExtracted([]);
    setSelected(new Set());
    setError(null);
    setPhase("idle");
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="h-10 px-3.5 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px] flex items-center gap-2"
      >
        <Icon name="image" size={16} />
        Upload palette image
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {(phase === "extracting" || phase === "review" || phase === "error") && (
        <div className="mt-3 p-3 bg-surface border border-hairline rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Palette upload preview"
                className="w-20 h-20 object-cover rounded border border-hairline shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {phase === "extracting" && (
                <div className="flex items-center gap-2 text-[13px] text-mid">
                  <span className="w-3 h-3 rounded-full border-2 border-hairline border-t-accent animate-spin" />
                  Reading colours from your image…
                </div>
              )}
              {phase === "review" && (
                <div className="space-y-1">
                  <p className="text-[13px] text-charcoal font-medium">
                    Found {extracted.length} colour{extracted.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11px] text-mid">
                    Tap to deselect any you don&apos;t want. {selected.size} selected.
                  </p>
                </div>
              )}
              {phase === "error" && (
                <p className="text-[13px] text-danger">{error}</p>
              )}
            </div>
            <button
              onClick={reset}
              className="w-7 h-7 flex items-center justify-center text-mid -m-1"
              aria-label="Cancel"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {phase === "review" && (
            <>
              <div className="flex flex-wrap gap-2">
                {extracted.map((s, i) => {
                  const isSelected = selected.has(i);
                  return (
                    <button
                      key={`${s.hex}-${i}`}
                      onClick={() => toggle(i)}
                      className={clsx(
                        "flex items-center gap-1.5 h-8 pl-2 pr-2.5 rounded-full border transition-colors",
                        isSelected
                          ? "border-charcoal bg-canvas"
                          : "border-hairline bg-canvas opacity-40"
                      )}
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: s.hex,
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      />
                      <span className="text-[12px] text-charcoal">{s.name}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={commit}
                disabled={selected.size === 0}
                className="w-full h-10 bg-charcoal text-surface text-[13px] font-medium rounded-[6px] disabled:opacity-40"
              >
                Add {selected.size} to palette
              </button>
            </>
          )}

          {phase === "error" && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-10 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px]"
            >
              Try another image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
