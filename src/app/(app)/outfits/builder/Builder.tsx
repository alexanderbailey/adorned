"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ItemCategory } from "@/lib/types";

export interface BuilderItem {
  id: string;
  cutout_image_url: string;
  thumb_image_url: string | null;
  category: ItemCategory;
  subcategory: string | null;
  primary_color_hex: string | null;
}

// Categories ordered for the bottom-sheet drawers.
const CATEGORY_ORDER: { value: ItemCategory; label: string }[] = [
  { value: "tops",        label: "Tops" },
  { value: "bottoms",     label: "Bottoms" },
  { value: "skirts",      label: "Skirts" },
  { value: "dresses",     label: "Dresses" },
  { value: "outerwear",   label: "Outerwear" },
  { value: "shoes",       label: "Shoes" },
  { value: "bags",        label: "Bags" },
  { value: "accessories", label: "Accessories" },
  { value: "jewellery",   label: "Jewellery" },
];

// Layout zones on the flat-lay canvas.
type Zone = "top-row" | "mid-row" | "bottom-row" | "right-stack" | "left-stack";
const ZONE_FOR: Record<ItemCategory, Zone> = {
  tops:        "top-row",
  outerwear:   "top-row",
  dresses:     "mid-row",
  bottoms:     "mid-row",
  skirts:      "mid-row",
  shoes:       "bottom-row",
  bags:        "right-stack",
  accessories: "right-stack",
  jewellery:   "left-stack",
};

export function Builder({ items }: { items: BuilderItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const byCategory = useMemo(() => {
    const map = new Map<ItemCategory, BuilderItem[]>();
    for (const it of items) {
      const existing = map.get(it.category) ?? [];
      existing.push(it);
      map.set(it.category, existing);
    }
    return map;
  }, [items]);

  const selectedItems = selectedIds
    .map((id) => itemsById.get(id))
    .filter((i): i is BuilderItem => !!i);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (selectedItems.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: outfit, error: outfitErr } = await supabase
        .from("outfits")
        .insert({ user_id: user.id, source: "manual" })
        .select("id")
        .single();
      if (outfitErr || !outfit) throw outfitErr ?? new Error("Outfit insert failed");

      const { error: itemsErr } = await supabase.from("outfit_items").insert(
        selectedItems.map((it, slot) => ({
          outfit_id: outfit.id,
          item_id: it.id,
          slot,
        }))
      );
      if (itemsErr) throw itemsErr;

      router.push("/outfits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline shrink-0">
        <Link
          href="/outfits"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">New outfit</span>
        <button
          onClick={handleSave}
          disabled={selectedItems.length === 0 || saving}
          className="h-8 px-3.5 bg-charcoal text-surface text-[13px] font-medium rounded-[6px] disabled:opacity-30"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Canvas (top half) */}
      <FlatLayCanvas items={selectedItems} onRemove={toggle} />

      {/* Error */}
      {error && (
        <p className="px-5 py-2 text-[13px] text-danger border-t border-hairline">
          {error}
        </p>
      )}

      {/* Bottom sheet — category drawers */}
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-hairline">
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[14px] text-mid">
              Your wardrobe is empty — add items first to build outfits.
            </p>
          </div>
        ) : (
          <div className="py-2 pb-32">
            {CATEGORY_ORDER.map(({ value, label }) => {
              const catItems = byCategory.get(value) ?? [];
              if (catItems.length === 0) return null;
              return (
                <CategoryRow
                  key={value}
                  label={label}
                  items={catItems}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FlatLayCanvas({
  items,
  onRemove,
}: {
  items: BuilderItem[];
  onRemove: (id: string) => void;
}) {
  // Group by zone for layout.
  const byZone = useMemo(() => {
    const z: Record<Zone, BuilderItem[]> = {
      "top-row": [],
      "mid-row": [],
      "bottom-row": [],
      "right-stack": [],
      "left-stack": [],
    };
    for (const it of items) z[ZONE_FOR[it.category]].push(it);
    return z;
  }, [items]);

  return (
    <div className="relative bg-surface-alt" style={{ height: 360 }}>
      {items.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] text-mid">Tap items below to build an outfit</p>
        </div>
      ) : (
        <>
          <Row items={byZone["top-row"]}    top={20}   onRemove={onRemove} />
          <Row items={byZone["mid-row"]}    top={140}  onRemove={onRemove} />
          <Row items={byZone["bottom-row"]} top={260}  onRemove={onRemove} />
          <Stack items={byZone["left-stack"]}  side="left"  onRemove={onRemove} />
          <Stack items={byZone["right-stack"]} side="right" onRemove={onRemove} />
        </>
      )}
    </div>
  );
}

function Row({
  items,
  top,
  onRemove,
}: {
  items: BuilderItem[];
  top: number;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="absolute inset-x-0 flex items-start justify-center gap-2 px-3"
      style={{ top }}
    >
      {items.map((it) => (
        <CanvasItem key={it.id} item={it} onClick={() => onRemove(it.id)} />
      ))}
    </div>
  );
}

function Stack({
  items,
  side,
  onRemove,
}: {
  items: BuilderItem[];
  side: "left" | "right";
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-2"
      style={side === "left" ? { left: 8 } : { right: 8 }}
    >
      {items.map((it) => (
        <CanvasItem
          key={it.id}
          item={it}
          size="sm"
          onClick={() => onRemove(it.id)}
        />
      ))}
    </div>
  );
}

function CanvasItem({
  item,
  size = "md",
  onClick,
}: {
  item: BuilderItem;
  size?: "sm" | "md";
  onClick: () => void;
}) {
  const dims = size === "sm" ? { w: 44, h: 56 } : { w: 64, h: 84 };
  return (
    <button
      onClick={onClick}
      className="bg-white rounded shadow-sm overflow-hidden"
      style={{ width: dims.w, height: dims.h }}
      aria-label="Remove from outfit"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumb_image_url ?? item.cutout_image_url}
        alt={item.subcategory ?? item.category}
        className="w-full h-full object-contain p-1"
      />
    </button>
  );
}

function CategoryRow({
  label,
  items,
  selectedIds,
  onToggle,
}: {
  label: string;
  items: BuilderItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="py-2">
      <p className="px-5 text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-1.5">
        {label}
      </p>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-5 pb-1">
          {items.map((it) => {
            const selected = selectedIds.includes(it.id);
            return (
              <button
                key={it.id}
                onClick={() => onToggle(it.id)}
                className={`shrink-0 w-[68px] aspect-[3/4] rounded bg-white relative overflow-hidden transition-all ${
                  selected ? "ring-2 ring-charcoal" : "ring-1 ring-hairline"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.thumb_image_url ?? it.cutout_image_url}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-charcoal text-canvas text-[10px] flex items-center justify-center">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
