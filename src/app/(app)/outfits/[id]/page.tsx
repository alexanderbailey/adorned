import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ItemCategory } from "@/lib/types";
import { OutfitActions } from "./OutfitActions";
import { WearLog, type WearLogEntry } from "./WearLog";
import { LookbookSection } from "./LookbookSection";
import { Icon } from "@/components/Icon";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface OutfitItemDetail {
  item_id: string;
  slot: number;
  items: {
    id: string;
    cutout_image_url: string;
    thumb_image_url: string | null;
    category: ItemCategory;
    subcategory: string | null;
    primary_color_name: string | null;
  } | null;
}

export default async function OutfitDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [{ data: outfitRaw }, { data: wearLogRaw }, { data: profile }] =
    await Promise.all([
      supabase
        .from("outfits")
        .select(
          `id, source, prompt, ai_reasoning, favorited, lookbook_url, created_at,
           outfit_items ( item_id, slot, items ( id, cutout_image_url, thumb_image_url, category, subcategory, primary_color_name ) )`
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("wear_log")
        .select("id, worn_on")
        .eq("outfit_id", id)
        .eq("user_id", user.id)
        .order("worn_on", { ascending: false }),
      supabase
        .from("profiles")
        .select("body_photo_url")
        .eq("id", user.id)
        .single(),
    ]);

  if (!outfitRaw) notFound();
  const wearEntries = (wearLogRaw ?? []) as WearLogEntry[];
  const hasBodyPhoto = !!profile?.body_photo_url;

  const outfit = outfitRaw as unknown as {
    id: string;
    source: "manual" | "generated";
    prompt: string | null;
    ai_reasoning: string | null;
    favorited: boolean;
    lookbook_url: string | null;
    created_at: string;
    outfit_items: OutfitItemDetail[];
  };
  const items = outfit.outfit_items ?? [];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
        <Link
          href="/outfits"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <Icon name="chevron_left" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">
          {outfit.source === "generated" ? "AI outfit" : "Outfit"}
        </span>
        <OutfitActions outfitId={outfit.id} initialFavorited={!!outfit.favorited} />
      </div>

      {/* Flat-lay hero */}
      <div className="relative h-[420px] bg-surface-alt border-b border-hairline overflow-hidden">
        <FlatLayHero items={items} />
      </div>

      <div className="px-5 py-5 space-y-5 pb-32">
        {outfit.ai_reasoning && (
          <section className="p-4 bg-surface border border-hairline rounded-lg">
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2">
              Stylist&apos;s notes
            </p>
            <p className="text-[14px] leading-[1.6] text-charcoal whitespace-pre-line">
              {outfit.ai_reasoning}
            </p>
          </section>
        )}

        {outfit.prompt && (
          <section>
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-1.5">
              Prompt
            </p>
            <p className="text-[13px] text-charcoal italic">&ldquo;{outfit.prompt}&rdquo;</p>
          </section>
        )}

        <LookbookSection
          outfitId={outfit.id}
          initialLookbookUrl={outfit.lookbook_url}
          hasBodyPhoto={hasBodyPhoto}
        />

        <WearLog outfitId={outfit.id} initialEntries={wearEntries} />

        <section>
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-2.5">
            Items
          </p>
          <div className="grid grid-cols-3 gap-px bg-hairline border border-hairline">
            {items.map((oi) =>
              oi.items ? (
                <Link
                  key={oi.item_id}
                  href={`/wardrobe/${oi.items.id}`}
                  className="aspect-[3/4] bg-white relative overflow-hidden block"
                >
                  <Image
                    src={oi.items.thumb_image_url ?? oi.items.cutout_image_url}
                    alt={oi.items.subcategory ?? oi.items.category}
                    fill
                    className="object-contain p-1.5"
                    sizes="33vw"
                  />
                </Link>
              ) : null
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FlatLayHero({ items }: { items: OutfitItemDetail[] }) {
  const tops = items.filter((i) =>
    i.items && ["tops", "outerwear"].includes(i.items.category)
  );
  const mid = items.filter((i) =>
    i.items && ["bottoms", "skirts", "dresses"].includes(i.items.category)
  );
  const shoes = items.filter((i) => i.items?.category === "shoes");
  const sideRight = items.filter((i) =>
    i.items && ["bags", "accessories"].includes(i.items.category)
  );
  const sideLeft = items.filter((i) => i.items?.category === "jewellery");

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-[13px] text-mid">No items</p>
      </div>
    );
  }

  return (
    <>
      {/* Main column: top → mid → shoes, touching */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-3">
        {tops.length > 0 && (
          <div className="flex justify-center gap-1 px-3">
            {tops.slice(0, 3).map((i) => (
              <HeroItem key={i.item_id} url={pickUrl(i)} w={110} />
            ))}
          </div>
        )}
        {mid.length > 0 && (
          <div className="flex justify-center gap-1 px-3">
            {mid.slice(0, 3).map((i) => (
              <HeroItem key={i.item_id} url={pickUrl(i)} w={110} />
            ))}
          </div>
        )}
        {shoes.length > 0 && (
          <div className="flex justify-center gap-1 px-3">
            {shoes.slice(0, 3).map((i) => (
              <HeroItem key={i.item_id} url={pickUrl(i)} w={85} />
            ))}
          </div>
        )}
      </div>

      {/* Side stacks — pulled in 12px from edge */}
      {sideRight.length > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {sideRight.slice(0, 3).map((i) => (
            <HeroItem key={i.item_id} url={pickUrl(i)} w={60} />
          ))}
        </div>
      )}
      {sideLeft.length > 0 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {sideLeft.slice(0, 3).map((i) => (
            <HeroItem key={i.item_id} url={pickUrl(i)} w={60} />
          ))}
        </div>
      )}
    </>
  );
}

function pickUrl(i: OutfitItemDetail): string {
  return i.items?.thumb_image_url ?? i.items?.cutout_image_url ?? "";
}

function HeroItem({ url, w }: { url: string; w: number }) {
  if (!url) return null;
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
