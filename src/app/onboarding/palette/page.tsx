"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PaletteSwatch } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { BrowseSeasonsSheet } from "./BrowseSeasonsSheet";
import { PaletteImageUpload } from "./PaletteImageUpload";

export default function PalettePage() {
  const router = useRouter();
  const [swatches, setSwatches] = useState<PaletteSwatch[]>([]);
  const [newHex, setNewHex] = useState("#888888");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("palette_swatches, onboarded_at")
        .eq("id", user.id)
        .single();
      if (profile?.onboarded_at) setIsEditing(true);
      if (profile?.palette_swatches) {
        setSwatches(profile.palette_swatches as PaletteSwatch[]);
      }
    })();
  }, []);

  function importSwatches(incoming: PaletteSwatch[]) {
    setSwatches((prev) => {
      const existing = new Set(prev.map((s) => s.hex.toLowerCase()));
      const additions = incoming.filter((s) => !existing.has(s.hex.toLowerCase()));
      return [...prev, ...additions];
    });
  }

  function removeSwatch(index: number) {
    setSwatches((prev) => prev.filter((_, i) => i !== index));
  }

  function addSwatch() {
    if (!newName.trim()) return;
    importSwatches([{ name: newName.trim(), hex: newHex }]);
    setNewName("");
  }

  async function handleContinue() {
    if (swatches.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ palette_swatches: swatches })
        .eq("id", user.id);
      if (dbError) throw dbError;

      router.push(isEditing ? "/profile" : "/onboarding/style");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <section className="space-y-3">
          <p className="text-[14px] text-mid">
            Build your colour palette — these are the colours that flatter you.
          </p>
          <div className="flex flex-wrap gap-2">
            <BrowseSeasonsSheet onImport={importSwatches} />
            <PaletteImageUpload existingSwatches={swatches} onImport={importSwatches} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Your swatches
            </h2>
            <span className="text-[11px] text-mid font-mono tabular-nums">
              {swatches.length}
            </span>
          </div>

          {swatches.length === 0 ? (
            <p className="text-[13px] text-mid italic">
              No colours yet. Browse a season, upload an image, or add one manually.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {swatches.map((s, i) => (
                <div
                  key={`${s.hex}-${i}`}
                  className="flex items-center gap-1.5 h-8 pl-2 pr-1 rounded-full border border-hairline bg-surface"
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: s.hex,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                  />
                  <span className="text-[12px] text-charcoal">{s.name}</span>
                  <button
                    onClick={() => removeSwatch(i)}
                    className="w-6 h-6 flex items-center justify-center text-mid"
                    aria-label={`Remove ${s.name}`}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="color"
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              className="w-9 h-9 rounded border border-hairline bg-transparent cursor-pointer"
              aria-label="Pick colour"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. dusty rose)"
              className="flex-1 h-9 px-3 text-[13px] border border-hairline rounded bg-surface text-charcoal outline-none focus:border-charcoal"
            />
            <button
              onClick={addSwatch}
              disabled={!newName.trim()}
              className="h-9 px-3 text-[13px] border border-border-strong rounded text-charcoal disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </section>
      </div>

      <div className="px-5 py-4 border-t border-hairline">
        {error && <p className="text-[13px] text-danger mb-2">{error}</p>}
        <button
          onClick={handleContinue}
          disabled={swatches.length === 0 || saving}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
        >
          {saving ? "Saving…" : isEditing ? "Save" : "Continue"}
        </button>
      </div>
    </div>
  );
}
