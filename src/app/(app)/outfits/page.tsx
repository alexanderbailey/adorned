import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ItemCategory } from "@/lib/types";
import { Icon } from "@/components/Icon";

interface OutfitItem {
  item_id: string;
  slot: number;
  items: {
    cutout_image_url: string;
    thumb_image_url: string | null;
    category: ItemCategory;
  } | null;
}

interface OutfitRow {
  id: string;
  source: "manual" | "generated";
  favorited: boolean;
  created_at: string;
  outfit_items: OutfitItem[];
  wear_count: number;
}

type Filter = "all" | "favorites";
type Sort = "recent" | "worn" | "never";

interface PageProps {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}

export default async function OutfitsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { filter, sort } = await searchParams;
  const activeFilter = (filter === "favorites" ? "favorites" : "all") as Filter;
  const activeSort = (["recent", "worn", "never"].includes(sort ?? "")
    ? (sort as Sort)
    : "recent") as Sort;

  let query = supabase
    .from("outfits")
    .select(
      `id, source, favorited, created_at,
       outfit_items ( item_id, slot, items ( cutout_image_url, thumb_image_url, category ) )`
    )
    .eq("user_id", user.id);

  if (activeFilter === "favorites") query = query.eq("favorited", true);

  const [outfitsRes, wearRes] = await Promise.all([
    query,
    supabase.from("wear_log").select("outfit_id").eq("user_id", user.id),
  ]);

  const wearCounts = new Map<string, number>();
  for (const w of (wearRes.data ?? []) as { outfit_id: string }[]) {
    wearCounts.set(w.outfit_id, (wearCounts.get(w.outfit_id) ?? 0) + 1);
  }

  const raw = (outfitsRes.data ?? []) as unknown as Omit<OutfitRow, "wear_count">[];
  let rows: OutfitRow[] = raw.map((r) => ({
    ...r,
    wear_count: wearCounts.get(r.id) ?? 0,
  }));

  if (activeSort === "worn") {
    rows.sort((a, b) =>
      b.wear_count - a.wear_count ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (activeSort === "never") {
    rows = rows.filter((r) => r.wear_count === 0);
    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else {
    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="px-5 pt-[54px] pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[30px] font-semibold tracking-[-0.7px] leading-none">
            Outfits
          </h1>
          <span className="text-[12px] text-mid font-mono tabular-nums">
            {rows.length} outfits
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-5 pb-2 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <FilterChip label="All"        href={hrefWith({ filter: "all", sort: activeSort })}  active={activeFilter === "all"} />
          <FilterChip label="Favourites" href={hrefWith({ filter: "favorites", sort: activeSort })} active={activeFilter === "favorites"} />
        </div>
        <SortSelector value={activeSort} filter={activeFilter} />
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-2">
          <p className="text-[14px] text-mid text-center">
            {activeFilter === "favorites"
              ? "No favourites yet — tap the heart on an outfit to add it here."
              : activeSort === "never"
                ? "All your outfits have been worn at least once."
                : "No outfits yet. Tap + to build your first."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-hairline border-t border-hairline">
          {rows.map((outfit) => (
            <Link
              key={outfit.id}
              href={`/outfits/${outfit.id}`}
              className="aspect-[3/4] bg-surface-alt relative overflow-hidden block"
            >
              <FlatLayThumbnail items={outfit.outfit_items} />
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                <span className="text-[10px] text-mid font-mono tabular-nums">
                  {new Date(outfit.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  {outfit.wear_count > 0 && (
                    <span className="text-[10px] text-mid font-mono tabular-nums">
                      {outfit.wear_count}×
                    </span>
                  )}
                  {outfit.favorited && (
                    <Icon name="favorite" filled size={10} className="text-accent" />
                  )}
                  {outfit.source === "generated" && (
                    <span className="text-[10px] text-accent">AI</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function hrefWith(params: { filter: Filter; sort: Sort }): string {
  const qs = new URLSearchParams();
  if (params.filter !== "all") qs.set("filter", params.filter);
  if (params.sort !== "recent") qs.set("sort", params.sort);
  const s = qs.toString();
  return s ? `/outfits?${s}` : "/outfits";
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`h-8 px-3.5 rounded-full border text-[13px] flex items-center transition-colors ${
        active
          ? "bg-charcoal text-surface border-charcoal font-medium"
          : "bg-transparent text-charcoal border-border-strong"
      }`}
    >
      {label}
    </Link>
  );
}

function SortSelector({ value, filter }: { value: Sort; filter: Filter }) {
  const labels: Record<Sort, string> = {
    recent: "Recent",
    worn: "Most worn",
    never: "Never worn",
  };
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-mid">Sort:</span>
      <div className="flex gap-1">
        {(Object.keys(labels) as Sort[]).map((s) => (
          <Link
            key={s}
            href={hrefWith({ filter, sort: s })}
            className={`text-[12px] px-2 py-1 rounded ${
              value === s ? "bg-surface-alt text-charcoal font-medium" : "text-mid"
            }`}
          >
            {labels[s]}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Mini version of the flat-lay layout.
function FlatLayThumbnail({ items }: { items: OutfitItem[] }) {
  const tops = items.filter((i) =>
    i.items && ["tops", "outerwear"].includes(i.items.category)
  );
  const mid = items.filter((i) =>
    i.items && ["bottoms", "skirts", "dresses"].includes(i.items.category)
  );
  const shoes = items.filter((i) => i.items?.category === "shoes");
  const side = items.filter((i) =>
    i.items && ["accessories", "bags", "jewellery"].includes(i.items.category)
  );

  return (
    <div className="absolute inset-0 p-2">
      <div className="absolute top-2 left-0 right-12 flex justify-center gap-1 px-2">
        {tops.slice(0, 2).map((i) => (
          <ItemMini key={i.item_id} url={pickUrl(i)} size={36} />
        ))}
      </div>
      <div className="absolute top-1/2 left-0 right-12 -translate-y-1/2 flex justify-center gap-1 px-2">
        {mid.slice(0, 2).map((i) => (
          <ItemMini key={i.item_id} url={pickUrl(i)} size={36} />
        ))}
      </div>
      <div className="absolute bottom-6 left-0 right-12 flex justify-center gap-1 px-2">
        {shoes.slice(0, 2).map((i) => (
          <ItemMini key={i.item_id} url={pickUrl(i)} size={28} />
        ))}
      </div>
      <div className="absolute top-2 right-1 flex flex-col gap-1">
        {side.slice(0, 3).map((i) => (
          <ItemMini key={i.item_id} url={pickUrl(i)} size={20} />
        ))}
      </div>
    </div>
  );
}

function pickUrl(i: OutfitItem): string {
  return i.items?.thumb_image_url ?? i.items?.cutout_image_url ?? "";
}

function ItemMini({ url, size }: { url: string; size: number }) {
  if (!url) return null;
  return (
    <span
      className="block bg-white rounded-sm overflow-hidden"
      style={{ width: size, height: size * (4 / 3) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-contain p-0.5" />
    </span>
  );
}
