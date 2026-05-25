import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DeleteItemButton } from "./DeleteItemButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SEASON_LABELS: Record<string, string> = {
  spring: "Spring", summer: "Summer", fall: "Autumn", winter: "Winter",
};
const FORMALITY_LABELS: Record<string, string> = {
  casual: "Casual", "smart-casual": "Smart-casual", formal: "Formal",
};

export default async function ItemDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item || item.archived) notFound();

  // Count outfits this item appears in
  const { count: outfitCount } = await supabase
    .from("outfit_items")
    .select("outfit_id", { count: "exact", head: true })
    .eq("item_id", id);

  const seasonLabel = item.season
    ?.map((s: string) => SEASON_LABELS[s] ?? s)
    .join(" / ") ?? "—";

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-[54px] h-[98px]">
        <Link href="/wardrobe" className="w-10 h-10 flex items-center justify-center text-charcoal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
        <div className="flex items-center">
          <Link
            href={`/wardrobe/${id}/edit`}
            className="w-10 h-10 flex items-center justify-center text-charcoal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>
            </svg>
          </Link>
          <DeleteItemButton itemId={id} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="relative w-full bg-[#F2EFE7] flex items-center justify-center" style={{ aspectRatio: "1 / 1.05" }}>
          <div className="relative w-[220px] h-[300px]">
            <Image
              src={item.cutout_image_url}
              alt={item.subcategory ?? item.category}
              fill
              className="object-contain"
              sizes="220px"
            />
          </div>
        </div>

        {/* Title block */}
        <div className="px-5 pt-6">
          <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-mid">
            {item.category}
            {item.subcategory && ` · ${item.subcategory}`}
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.5px] leading-[1.15] mt-1.5">
            {item.primary_color_name
              ? `${item.primary_color_name.charAt(0).toUpperCase() + item.primary_color_name.slice(1)} ${item.subcategory ?? item.category}`
              : item.subcategory ?? item.category}
          </h1>
        </div>

        {/* Tag rows */}
        <div className="px-5 pt-4 flex flex-col gap-3.5">
          {item.primary_color_hex && (
            <TagRow label="Colour">
              <div className="flex items-center gap-2">
                <span
                  className="w-[22px] h-[22px] rounded-full shrink-0"
                  style={{
                    background: item.primary_color_hex,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                  }}
                />
                <span className="text-[13px]">{item.primary_color_name}</span>
              </div>
            </TagRow>
          )}
          {item.material && <TagRow label="Material"><span className="text-[13px]">{item.material}</span></TagRow>}
          {item.season?.length && <TagRow label="Season"><span className="text-[13px]">{seasonLabel}</span></TagRow>}
          {item.formality && <TagRow label="Formality"><span className="text-[13px]">{FORMALITY_LABELS[item.formality] ?? item.formality}</span></TagRow>}
        </div>

        <div className="h-px bg-hairline mx-5 my-5" />

        {/* AI description */}
        {item.ai_description && (
          <div className="px-5">
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
              </svg>
              <span className="text-[11px] font-semibold tracking-[1.2px] uppercase text-mid">
                From your wardrobe
              </span>
            </div>
            <p className="text-[14px] leading-[1.55]">{item.ai_description}</p>
          </div>
        )}

        {/* Outfit count */}
        {(outfitCount ?? 0) > 0 && (
          <div className="mx-5 mt-6 p-4 bg-surface border border-hairline rounded-lg flex items-center justify-between">
            <span className="text-[13px]">
              Used in <strong className="font-semibold">{outfitCount}</strong> outfit{outfitCount !== 1 ? "s" : ""}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-mid">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}

function TagRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="text-[12px] text-mid w-20 shrink-0">{label}</span>
      {children}
    </div>
  );
}
