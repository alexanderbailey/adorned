import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ItemCategory, ItemSeason } from "@/lib/types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { FilterSheet, type FilterDomain } from "./FilterSheet";

const CATEGORIES: { label: string; value: ItemCategory | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Tops",       value: "tops" },
  { label: "Bottoms",    value: "bottoms" },
  { label: "Skirts",     value: "skirts" },
  { label: "Dresses",    value: "dresses" },
  { label: "Outerwear",  value: "outerwear" },
  { label: "Shoes",      value: "shoes" },
  { label: "Bags",       value: "bags" },
  { label: "Accessories",value: "accessories" },
  { label: "Jewellery",  value: "jewellery" },
];

interface PageProps {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    color?: string;
    season?: string;
  }>;
}

interface WardrobeItem {
  id: string;
  cutout_image_url: string;
  thumb_image_url: string | null;
  category: ItemCategory;
  subcategory: string | null;
  primary_color_hex: string | null;
  primary_color_name: string | null;
  season: ItemSeason[] | null;
}

export default async function WardrobePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { category, subcategory, color, season } = await searchParams;
  const activeCategory = (category ?? "all") as ItemCategory | "all";

  // Pull every non-archived item once — derive both the gallery and the
  // filter domain from the same dataset. 80-item wardrobes don't need a join.
  const { data: allItemsRaw } = await supabase
    .from("items")
    .select(
      "id, cutout_image_url, thumb_image_url, category, subcategory, primary_color_hex, primary_color_name, season"
    )
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const allItems = (allItemsRaw ?? []) as WardrobeItem[];

  const items = allItems.filter((it) => {
    if (activeCategory !== "all" && it.category !== activeCategory) return false;
    if (subcategory && it.subcategory !== subcategory) return false;
    if (color && it.primary_color_name !== color) return false;
    if (season && !(it.season ?? []).includes(season as ItemSeason)) return false;
    return true;
  });

  const filterDomain: FilterDomain = buildFilterDomain(allItems, activeCategory);

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Header */}
      <div className="px-5 pt-[54px] pb-3">
        {/* Wordmark + search/filter */}
        <div className="flex items-center justify-between h-9">
          <span className="text-[22px] font-medium tracking-[-0.4px] italic">Adorned</span>
          <div className="flex gap-1">
            <button className="w-9 h-9 flex items-center justify-center text-charcoal" aria-label="Search">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <FilterSheet domain={filterDomain} />
          </div>
        </div>
        {/* Title + count */}
        <div className="flex items-baseline justify-between mt-3.5">
          <h1 className="text-[30px] font-semibold tracking-[-0.7px] leading-none">
            Wardrobe
          </h1>
          <span className="text-[12px] text-mid font-mono tabular-nums">
            {items?.length ?? 0} items
          </span>
        </div>
      </div>

      {/* Category chips — horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide border-b border-hairline py-2">
        <div className="flex gap-2 px-5">
          {CATEGORIES.map(({ label, value }) => {
            const active = activeCategory === value;
            return (
              <Link
                key={value}
                href={value === "all" ? "/wardrobe" : `/wardrobe?category=${value}`}
                className={`shrink-0 h-8 px-3.5 rounded-full border text-[13px] transition-colors ${
                  active
                    ? "bg-charcoal text-surface border-charcoal font-medium"
                    : "bg-transparent text-charcoal border-border-strong"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {!items?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
          <p className="text-[14px] text-mid text-center">
            {allItems.length === 0
              ? "Your wardrobe is empty. Add your first item."
              : subcategory || color || season
                ? "No items match these filters."
                : `No ${activeCategory} yet.`}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-px bg-hairline"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/wardrobe/${item.id}`}
              className="aspect-[3/4] bg-white relative overflow-hidden block"
            >
              <Image
                src={item.thumb_image_url ?? item.cutout_image_url}
                alt={item.subcategory ?? item.category}
                fill
                className="object-contain p-1.5"
                sizes="33vw"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function buildFilterDomain(
  items: WardrobeItem[],
  activeCategory: ItemCategory | "all"
): FilterDomain {
  // Filter domain narrows by category so chips reflect what's actually in view.
  const scoped =
    activeCategory === "all"
      ? items
      : items.filter((it) => it.category === activeCategory);

  const subcategories = Array.from(
    new Set(scoped.map((it) => it.subcategory).filter((s): s is string => !!s))
  ).sort();

  const colorMap = new Map<string, string>();
  for (const it of scoped) {
    if (it.primary_color_name && it.primary_color_hex && !colorMap.has(it.primary_color_name)) {
      colorMap.set(it.primary_color_name, it.primary_color_hex);
    }
  }
  const colors = Array.from(colorMap, ([name, hex]) => ({ name, hex })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  return { subcategories, colors };
}
