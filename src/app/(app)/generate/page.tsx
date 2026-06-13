"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ItemCategory, PromptChips } from "@/lib/types";
import { clsx } from "clsx";
import { extractErrorMessage } from "@/lib/error";
import { useEntitlements } from "@/lib/billing/useEntitlements";
import { DailyCapCooldown } from "@/components/billing/DailyCapCooldown";

type Phase = "input" | "loading" | "results" | "cap_reached";

interface ItemLite {
  id: string;
  cutout_image_url: string;
  thumb_image_url: string | null;
  category: ItemCategory;
  subcategory: string | null;
}

interface GeneratedOutfit {
  item_ids: string[];
  reasoning: string;
}

const PLACEHOLDERS = [
  "Beach lunch with friends",
  "Smart-casual office in November",
  "First date — relaxed cocktail bar",
  "Sunday market wander, cold weather",
  "Wedding guest, garden ceremony",
  "Out-of-town weekend trip",
];

const CHIP_OPTIONS: { key: keyof PromptChips; label: string; values: string[] }[] = [
  { key: "occasion",  label: "Occasion",
    values: ["work", "weekend", "evening", "date", "party", "formal", "travel"] },
  { key: "weather",   label: "Weather",
    values: ["warm", "mild", "cool", "cold", "rain"] },
  { key: "formality", label: "Formality",
    values: ["casual", "smart-casual", "formal"] },
];

export default function GeneratePage() {
  const router = useRouter();
  const { data: entitlements, refresh: refreshEntitlements } = useEntitlements();
  const [phase, setPhase] = useState<Phase>("input");
  const [prompt, setPrompt] = useState("");
  const [chips, setChips] = useState<PromptChips>({});
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [items, setItems] = useState<ItemLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const lastRequestRef = useRef<{ prompt: string; chips: PromptChips } | null>(null);

  // Rotate placeholder examples every few seconds while idle.
  useEffect(() => {
    if (phase !== "input") return;
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(t);
  }, [phase]);

  // Load items once for lookup during results.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("items")
        .select("id, cutout_image_url, thumb_image_url, category, subcategory")
        .eq("user_id", user.id)
        .eq("archived", false);
      setItems((data ?? []) as ItemLite[]);
    })();
  }, []);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function toggleChip(key: keyof PromptChips, value: string) {
    setChips((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  }

  async function runGenerate(req: { prompt: string; chips: PromptChips }) {
    setPhase("loading");
    setError(null);
    lastRequestRef.current = req;
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.status === 429) {
        setPhase("cap_reached");
        void refreshEntitlements();
        return;
      }
      if (!res.ok) {
        const body = await res.text();
        const msg = extractErrorMessage(body) || `HTTP ${res.status}`;
        throw new Error(msg.slice(0, 300));
      }
      const { outfits: result } = (await res.json()) as { outfits: GeneratedOutfit[] };
      setOutfits(result);
      setPhase("results");
      void refreshEntitlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setPhase("input");
    }
  }

  function handleGenerate() {
    if (!prompt.trim() && Object.values(chips).every((v) => !v)) {
      setError("Add a prompt or pick at least one chip.");
      return;
    }
    runGenerate({ prompt: prompt.trim(), chips });
  }

  function handleRegenerate() {
    if (lastRequestRef.current) runGenerate(lastRequestRef.current);
  }

  async function handleSave(outfit: GeneratedOutfit) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }

    const { data: outfitRow, error: outfitErr } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        source: "generated",
        prompt: prompt.trim() || null,
        prompt_chips: chips,
        ai_reasoning: outfit.reasoning,
      })
      .select("id")
      .single();
    if (outfitErr || !outfitRow) {
      setError(outfitErr?.message ?? "Save failed");
      return;
    }

    const { error: itemsErr } = await supabase.from("outfit_items").insert(
      outfit.item_ids.map((id, slot) => ({
        outfit_id: outfitRow.id,
        item_id: id,
        slot,
      }))
    );
    if (itemsErr) {
      setError(itemsErr.message);
      return;
    }
    router.push(`/outfits/${outfitRow.id}`);
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
        <p className="text-[14px] text-mid">Styling 3 looks…</p>
      </div>
    );
  }

  if (phase === "cap_reached") {
    return (
      <DailyCapCooldown
        currentTier={entitlements?.tier ?? null}
        onDismiss={() => setPhase("input")}
      />
    );
  }

  if (phase === "results") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <div className="px-5 pt-[54px] pb-3 flex items-baseline justify-between">
          <h1 className="text-[24px] font-semibold tracking-[-0.5px]">Suggestions</h1>
          <button
            onClick={() => setPhase("input")}
            className="text-[13px] text-mid underline underline-offset-2"
          >
            New
          </button>
        </div>
        {error && (
          <p className="px-5 pb-2 text-[13px] text-danger">{error}</p>
        )}
        <div className="px-5 space-y-4 pb-40">
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={i}
              index={i}
              outfit={outfit}
              itemsById={itemsById}
              onSave={() => handleSave(outfit)}
            />
          ))}
          <button
            onClick={handleRegenerate}
            className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px]"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  // input phase
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="px-5 pt-[54px] pb-3">
        <h1 className="text-[30px] font-semibold tracking-[-0.7px] leading-none">
          Generate
        </h1>
      </div>

      <div className="flex-1 px-5 pb-10 space-y-5 overflow-y-auto">
        <div>
          <label className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
            Tell me the occasion
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="mt-2 w-full p-3 text-[14px] leading-[1.55] text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal resize-vertical"
          />
        </div>

        {CHIP_OPTIONS.map(({ key, label, values }) => (
          <div key={key}>
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2">
              {label}
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map((v) => {
                const active = chips[key] === v;
                return (
                  <button
                    key={v}
                    onClick={() => toggleChip(key, v)}
                    className={clsx(
                      "inline-flex items-center h-8 px-3 rounded-full border text-[13px] capitalize leading-none transition-colors",
                      active
                        ? "bg-charcoal text-surface border-charcoal font-medium"
                        : "bg-transparent text-charcoal border-border-strong"
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-hairline">
        <button
          onClick={handleGenerate}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px]"
        >
          Style me
        </button>
      </div>
    </div>
  );
}

function OutfitCard({
  index,
  outfit,
  itemsById,
  onSave,
}: {
  index: number;
  outfit: { item_ids: string[]; reasoning: string };
  itemsById: Map<string, ItemLite>;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const resolvedItems = outfit.item_ids
    .map((id) => itemsById.get(id))
    .filter((i): i is ItemLite => !!i);

  async function handleClick() {
    setSaving(true);
    await onSave();
    setSaved(true);
    setSaving(false);
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          Look {index + 1}
        </span>
        <span className="text-[11px] text-mid font-mono tabular-nums">
          {resolvedItems.length} items
        </span>
      </div>
      <div className="relative h-[280px] bg-surface-alt mx-3 rounded overflow-hidden">
        <FlatLayMini items={resolvedItems} />
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] leading-[1.55] text-charcoal">{outfit.reasoning}</p>
      </div>
      <div className="px-3 pb-3">
        <button
          onClick={handleClick}
          disabled={saving || saved || resolvedItems.length === 0}
          className="w-full h-10 bg-charcoal text-surface text-[13px] font-medium rounded-[6px] disabled:opacity-40"
        >
          {saved ? "Saved" : saving ? "Saving…" : "Save outfit"}
        </button>
      </div>
    </div>
  );
}

function FlatLayMini({ items }: { items: ItemLite[] }) {
  const tops = items.filter((i) => ["tops", "outerwear"].includes(i.category));
  const mid = items.filter((i) => ["bottoms", "skirts", "dresses"].includes(i.category));
  const shoes = items.filter((i) => i.category === "shoes");
  const side = items.filter((i) =>
    ["accessories", "bags", "jewellery"].includes(i.category)
  );

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-[12px] text-mid">No items matched</p>
      </div>
    );
  }

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-2">
        {tops.length > 0 && (
          <div className="flex justify-center gap-1">
            {tops.slice(0, 2).map((i) => (
              <Mini key={i.id} url={i.thumb_image_url ?? i.cutout_image_url} w={74} />
            ))}
          </div>
        )}
        {mid.length > 0 && (
          <div className="flex justify-center gap-1">
            {mid.slice(0, 2).map((i) => (
              <Mini key={i.id} url={i.thumb_image_url ?? i.cutout_image_url} w={74} />
            ))}
          </div>
        )}
        {shoes.length > 0 && (
          <div className="flex justify-center gap-1">
            {shoes.slice(0, 2).map((i) => (
              <Mini key={i.id} url={i.thumb_image_url ?? i.cutout_image_url} w={54} />
            ))}
          </div>
        )}
      </div>
      {side.length > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {side.slice(0, 3).map((i) => (
            <Mini key={i.id} url={i.thumb_image_url ?? i.cutout_image_url} w={40} />
          ))}
        </div>
      )}
    </>
  );
}

function Mini({ url, w }: { url: string; w: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="block object-contain shrink-0"
      style={{ width: w, height: w * (4 / 3) }}
    />
  );
}
