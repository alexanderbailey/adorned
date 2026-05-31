"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ItemTags } from "@/lib/claude/tag-item";
import type { ItemCategory, ItemFormality, ItemSeason } from "@/lib/types";
import { clsx } from "clsx";
import { Icon } from "@/components/Icon";

const CATEGORIES: ItemCategory[] = [
  "tops", "bottoms", "skirts", "dresses", "outerwear",
  "shoes", "bags", "accessories", "jewellery",
];
const SEASONS: { value: ItemSeason; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall",   label: "Autumn" },
  { value: "winter", label: "Winter" },
];
const FORMALITIES: ItemFormality[] = ["casual", "smart-casual", "formal"];

interface ReviewPayload {
  itemId: string;
  originalImageUrl: string;
  cutoutImageUrl: string;
  thumbImageUrl: string | null;
  tags: ItemTags;
}

export default function ReviewPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [tags, setTags] = useState<ItemTags | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("adorned:add-review");
    if (!raw) { router.replace("/wardrobe/add"); return; }
    const p = JSON.parse(raw) as ReviewPayload;
    setPayload(p);
    setTags(p.tags);
  }, [router]);

  if (!payload || !tags) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
      </div>
    );
  }

  async function handleSave() {
    if (!payload || !tags) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase.from("items").insert({
        id: payload.itemId,
        user_id: user.id,
        original_image_url: payload.originalImageUrl,
        cutout_image_url: payload.cutoutImageUrl,
        thumb_image_url: payload.thumbImageUrl,
        category: tags.category,
        subcategory: tags.subcategory,
        primary_color_hex: tags.primary_color_hex,
        primary_color_name: tags.primary_color_name,
        secondary_colors: tags.secondary_colors,
        material: tags.material,
        pattern: tags.pattern,
        season: tags.season,
        formality: tags.formality,
        palette_fit_tags: tags.palette_fit_tags,
        ai_description: tags.ai_description,
        archived: false,
      });

      if (dbError) throw dbError;
      sessionStorage.removeItem("adorned:add-review");
      router.push(`/wardrobe/${payload.itemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  const SparkleIcon = () => <Icon name="auto_awesome" size={12} className="text-accent" />;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
        <Link href="/wardrobe/add" className="w-10 h-10 flex items-center justify-center text-charcoal">
          <Icon name="close" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">Review item</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-3.5 bg-charcoal text-surface text-[13px] font-medium rounded-[6px] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Cutout preview */}
        <div className="relative w-full bg-[#F0EDE3] flex items-center justify-center border-b border-hairline" style={{ height: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={payload.cutoutImageUrl}
            alt="Item cutout"
            className="max-w-[200px] max-h-[280px] object-contain"
          />
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-charcoal/85 text-surface text-[11px] font-medium px-2.5 py-1.5 rounded-[6px]">
            <SparkleIcon />
            <span className="text-[#F4E5BA]">Background removed</span>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-[13px] text-danger">{error}</p>
          )}

          {/* Category */}
          <Field label="Category" suggested>
            <select
              value={tags.category}
              onChange={(e) => setTags({ ...tags, category: e.target.value as ItemCategory })}
              className="w-full bg-transparent text-[14px] text-charcoal capitalize outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>

          {/* Subcategory */}
          <Field label="Subcategory" suggested>
            <input
              value={tags.subcategory}
              onChange={(e) => setTags({ ...tags, subcategory: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
              placeholder="e.g. blouse, straight-leg jeans"
            />
          </Field>

          {/* Primary color */}
          <Field label="Colour" suggested>
            <div className="flex items-center gap-2.5">
              <span
                className="w-[22px] h-[22px] rounded-full shrink-0"
                style={{
                  background: tags.primary_color_hex,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              />
              <input
                value={tags.primary_color_name}
                onChange={(e) => setTags({ ...tags, primary_color_name: e.target.value })}
                className="flex-1 bg-transparent text-[14px] text-charcoal outline-none"
              />
            </div>
          </Field>

          {/* Material */}
          <Field label="Material" suggested>
            <input
              value={tags.material}
              onChange={(e) => setTags({ ...tags, material: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
            />
          </Field>

          <Field label="Seasons" suggested>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {SEASONS.map((s) => {
                const active = tags.season?.includes(s.value) ?? false;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      const current = new Set(tags.season ?? []);
                      if (current.has(s.value)) current.delete(s.value);
                      else current.add(s.value);
                      setTags({ ...tags, season: Array.from(current) });
                    }}
                    className={clsx(
                      "inline-flex items-center h-8 px-3 rounded-full border text-[13px] leading-none transition-colors",
                      active
                        ? "bg-charcoal text-surface border-charcoal font-medium"
                        : "bg-transparent text-charcoal border-border-strong"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Formality">
            <select
              value={tags.formality}
              onChange={(e) => setTags({ ...tags, formality: e.target.value as ItemFormality })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
            >
              {FORMALITIES.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </Field>

          {/* AI description */}
          <div className="p-3.5 bg-surface-alt border border-hairline rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <SparkleIcon />
              <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Suggested description
              </span>
            </div>
            <textarea
              value={tags.ai_description}
              onChange={(e) => setTags({ ...tags, ai_description: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-[13px] leading-[1.55] text-charcoal outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  suggested,
  children,
}: {
  label: string;
  suggested?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3.5 bg-surface border border-hairline rounded-lg">
      <div className={clsx("flex items-center mb-1.5", suggested ? "justify-between" : "")}>
        <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          {label}
        </span>
        {suggested && (
          <span className="flex items-center gap-1 text-[10px] text-accent font-medium">
            <Icon name="auto_awesome" size={10} />
            Suggested
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
