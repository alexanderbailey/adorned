import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ItemCategory } from "@/lib/types";

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
  searchParams: Promise<{ category?: string }>;
}

export default async function WardrobePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { category } = await searchParams;
  const activeCategory = (category ?? "all") as ItemCategory | "all";

  let query = supabase
    .from("items")
    .select("id, cutout_image_url, thumb_image_url, category, subcategory, primary_color_hex")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (activeCategory !== "all") {
    query = query.eq("category", activeCategory);
  }

  const { data: items } = await query;

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Header */}
      <div className="px-5 pt-[54px] pb-3">
        {/* Wordmark + search/filter */}
        <div className="flex items-center justify-between h-9">
          <span className="text-[22px] font-medium tracking-[-0.4px] italic">Adorned</span>
          <div className="flex gap-1">
            <button className="w-9 h-9 flex items-center justify-center text-charcoal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-charcoal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16M7 12h10M10 19h4"/>
              </svg>
            </button>
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
            {activeCategory === "all"
              ? "Your wardrobe is empty. Add your first item."
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
