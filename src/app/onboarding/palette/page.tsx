"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PALETTE_PRESETS } from "@/lib/palette-presets";
import type { PaletteSwatch } from "@/lib/types";
import { clsx } from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function PalettePage() {
  const router = useRouter();
  const [presetId, setPresetId] = useState<string | null>(null);
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
        .select("palette_preset, palette_swatches, onboarded_at")
        .eq("id", user.id)
        .single();
      if (profile?.onboarded_at) setIsEditing(true);
      if (profile?.palette_preset) setPresetId(profile.palette_preset);
      if (profile?.palette_swatches) {
        setSwatches(profile.palette_swatches as PaletteSwatch[]);
      }
    })();
  }, []);

  function selectPreset(id: string) {
    const preset = PALETTE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setSwatches(preset.swatches);
  }

  function removeSwatch(index: number) {
    setSwatches((prev) => prev.filter((_, i) => i !== index));
  }

  function addSwatch() {
    if (!newName.trim()) return;
    setSwatches((prev) => [...prev, { name: newName.trim(), hex: newHex }]);
    setNewName("");
  }

  async function handleContinue() {
    if (!presetId) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          palette_preset: presetId,
          palette_swatches: swatches,
        })
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
            Pick the season that feels closest. You can tweak the swatches after.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PALETTE_PRESETS.map((p) => {
              const active = presetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p.id)}
                  className={clsx(
                    "text-left p-3 rounded-lg border transition-colors",
                    active
                      ? "border-charcoal bg-surface"
                      : "border-hairline bg-canvas"
                  )}
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
              );
            })}
          </div>
        </section>

        {presetId && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Your swatches
            </h2>

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
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

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
        )}
      </div>

      <div className="px-5 py-4 border-t border-hairline">
        {error && <p className="text-[13px] text-danger mb-2">{error}</p>}
        <button
          onClick={handleContinue}
          disabled={!presetId || saving}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
        >
          {saving ? "Saving…" : isEditing ? "Save" : "Continue"}
        </button>
      </div>
    </div>
  );
}
