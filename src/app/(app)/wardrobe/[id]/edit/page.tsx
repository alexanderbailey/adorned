"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type {
  ItemCategory,
  ItemFormality,
  ItemSeason,
  SecondaryColor,
} from "@/lib/types";
import { clsx } from "clsx";

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

interface EditableItem {
  cutout_image_url: string;
  category: ItemCategory;
  subcategory: string | null;
  primary_color_hex: string | null;
  primary_color_name: string | null;
  secondary_colors: SecondaryColor[];
  material: string | null;
  pattern: string | null;
  season: ItemSeason[] | null;
  formality: ItemFormality | null;
  palette_fit_tags: string[] | null;
  ai_description: string | null;
  user_notes: string | null;
}

export default function EditItemPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const itemId = params.id;

  const [item, setItem] = useState<EditableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data, error: dbErr } = await supabase
        .from("items")
        .select(
          "cutout_image_url, category, subcategory, primary_color_hex, primary_color_name, secondary_colors, material, pattern, season, formality, palette_fit_tags, ai_description, user_notes"
        )
        .eq("id", itemId)
        .eq("user_id", user.id)
        .eq("archived", false)
        .single();
      if (dbErr || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setItem(data as EditableItem);
      setLoading(false);
    })();
  }, [itemId, router]);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("items")
        .update({
          category: item.category,
          subcategory: item.subcategory,
          primary_color_hex: item.primary_color_hex,
          primary_color_name: item.primary_color_name,
          material: item.material,
          season: item.season,
          formality: item.formality,
          ai_description: item.ai_description,
          user_notes: item.user_notes,
        })
        .eq("id", itemId);
      if (dbErr) throw dbErr;
      toast.show("Item updated", "success");
      router.push(`/wardrobe/${itemId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 gap-3">
        <p className="text-[14px] text-mid">Item not found.</p>
        <Link href="/wardrobe" className="text-[13px] text-charcoal underline underline-offset-2">
          Back to wardrobe
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
        <Link
          href={`/wardrobe/${itemId}`}
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <Icon name="close" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">Edit item</span>
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
        <div
          className="relative w-full bg-[#F0EDE3] flex items-center justify-center border-b border-hairline"
          style={{ height: 280 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.cutout_image_url}
            alt="Item cutout"
            className="max-w-[200px] max-h-[240px] object-contain"
          />
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {error && <p className="text-[13px] text-danger">{error}</p>}

          <Field label="Category">
            <select
              value={item.category}
              onChange={(e) => setItem({ ...item, category: e.target.value as ItemCategory })}
              className="w-full bg-transparent text-[14px] text-charcoal capitalize outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Subcategory">
            <input
              value={item.subcategory ?? ""}
              onChange={(e) => setItem({ ...item, subcategory: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
              placeholder="e.g. blouse, straight-leg jeans"
            />
          </Field>

          <Field label="Colour">
            <div className="flex items-center gap-2.5">
              <span
                className="w-[22px] h-[22px] rounded-full shrink-0"
                style={{
                  background: item.primary_color_hex ?? "#cccccc",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              />
              <input
                value={item.primary_color_name ?? ""}
                onChange={(e) => setItem({ ...item, primary_color_name: e.target.value })}
                className="flex-1 bg-transparent text-[14px] text-charcoal outline-none"
                placeholder="e.g. dusty rose"
              />
            </div>
          </Field>

          <Field label="Material">
            <input
              value={item.material ?? ""}
              onChange={(e) => setItem({ ...item, material: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
              placeholder="e.g. cotton, wool blend"
            />
          </Field>

          <Field label="Seasons">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {SEASONS.map((s) => {
                const active = item.season?.includes(s.value) ?? false;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      const current = new Set(item.season ?? []);
                      if (current.has(s.value)) current.delete(s.value);
                      else current.add(s.value);
                      setItem({ ...item, season: Array.from(current) });
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
              value={item.formality ?? "casual"}
              onChange={(e) => setItem({ ...item, formality: e.target.value as ItemFormality })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
            >
              {FORMALITIES.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </Field>

          <div className="p-3.5 bg-surface-alt border border-hairline rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="auto_awesome" size={12} className="text-accent" />
              <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Description
              </span>
            </div>
            <textarea
              value={item.ai_description ?? ""}
              onChange={(e) => setItem({ ...item, ai_description: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-[13px] leading-[1.55] text-charcoal outline-none resize-none"
              placeholder="A short styling note"
            />
          </div>

          <div className="p-3.5 bg-surface border border-hairline rounded-lg">
            <span className="block text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2">
              Your notes
            </span>
            <textarea
              value={item.user_notes ?? ""}
              onChange={(e) => setItem({ ...item, user_notes: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-[13px] leading-[1.55] text-charcoal outline-none resize-none"
              placeholder="Anything you want to remember about this item"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3.5 bg-surface border border-hairline rounded-lg">
      <span className="block text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-1.5">
        {label}
      </span>
      {children}
    </div>
  );
}
