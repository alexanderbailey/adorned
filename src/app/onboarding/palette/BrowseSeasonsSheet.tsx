"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PALETTE_PRESETS } from "@/lib/palette-presets";
import type { PaletteSwatch } from "@/lib/types";
import { Icon } from "@/components/Icon";

export function BrowseSeasonsSheet({
  onImport,
}: {
  onImport: (swatches: PaletteSwatch[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent background scroll while sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function handlePick(id: string) {
    const preset = PALETTE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    onImport(preset.swatches);
    setOpen(false);
  }

  const sheet = open && (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-charcoal/30"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full bg-canvas rounded-t-2xl max-h-[85vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline sticky top-0 bg-canvas">
              <div className="w-10" />
              <span className="text-[15px] font-semibold tracking-[-0.2px]">
                Browse seasons
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-charcoal"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="px-5 pt-3 text-[13px] text-mid">
              Tap a season to add all of its colours to your palette. You can do this multiple times.
            </p>
            <div className="grid grid-cols-2 gap-3 px-5 py-4">
              {PALETTE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p.id)}
                  className="text-left p-3 rounded-lg border border-hairline bg-canvas transition-colors active:bg-surface"
                >
                  <div className="grid grid-cols-6 gap-[3px] mb-2 w-fit">
                    {p.swatches.map((s, i) => (
                      <span
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: s.hex,
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] font-medium text-charcoal leading-tight">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-mid mt-0.5 leading-snug">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 px-3.5 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px] flex items-center gap-2"
      >
        <Icon name="palette" size={16} />
        Browse seasons
      </button>
      {mounted && sheet ? createPortal(sheet, document.body) : null}
    </>
  );
}
