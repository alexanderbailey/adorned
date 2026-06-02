import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { visualizeOutfit, QUALITY_TIERS, type QualityTier } from "@/lib/gemini/visualize-outfit";
import type { ItemCategory } from "@/lib/types";

// Gemini image gen can take 15-30s. Bump max function duration.
export const maxDuration = 60;

interface OutfitItemRow {
  items: {
    cutout_image_url: string;
    thumb_image_url: string | null;
    category: ItemCategory;
    subcategory: string | null;
    primary_color_name: string | null;
  } | null;
}

// (Image-transform helper removed — Supabase's render endpoint was cropping
// the body photo unexpectedly. Sending the original URL through to Gemini.)

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id: outfitId } = await context.params;

  let quality: QualityTier = "standard";
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = (await request.json()) as { quality?: string };
      if (body.quality && body.quality in QUALITY_TIERS) {
        quality = body.quality as QualityTier;
      }
    } catch {
      // No body / not JSON — fall back to default.
    }
  }

  // Pull the outfit + its items, plus user's body photo.
  const [outfitRes, profileRes] = await Promise.all([
    supabase
      .from("outfits")
      .select(
        `id, user_id, prompt, ai_reasoning,
         outfit_items ( items ( cutout_image_url, thumb_image_url, category, subcategory, primary_color_name ) )`
      )
      .eq("id", outfitId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("body_photo_url, style_summary")
      .eq("id", user.id)
      .single(),
  ]);

  const outfitRaw = outfitRes.data as unknown as {
    id: string;
    user_id: string;
    prompt: string | null;
    ai_reasoning: string | null;
    outfit_items: OutfitItemRow[];
  } | null;
  if (outfitRes.error || !outfitRaw) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }
  const outfit = outfitRaw;

  const bodyPhotoUrl = profileRes.data?.body_photo_url;
  if (!bodyPhotoUrl) {
    return NextResponse.json(
      { error: "Add a body reference photo in your profile first." },
      { status: 400 }
    );
  }

  // Prefer thumbs (~400px) over full cutouts to keep Gemini latency low.
  // Pass each item with a category label so Gemini doesn't merge top+skirt → dress.
  const visualizeItems = outfit.outfit_items
    .map((oi) => {
      const it = oi.items;
      if (!it) return null;
      const url = it.thumb_image_url ?? it.cutout_image_url;
      if (!url) return null;
      const label = it.subcategory ? `${it.subcategory} (${it.category})` : it.category;
      return { url, label };
    })
    .filter((x): x is { url: string; label: string } => !!x);
  if (visualizeItems.length === 0) {
    return NextResponse.json(
      { error: "This outfit has no items." },
      { status: 400 }
    );
  }

  const context_ = [
    outfit.prompt ? `Occasion: ${outfit.prompt}` : null,
    outfit.ai_reasoning ? `Stylist notes: ${outfit.ai_reasoning}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { imageBytes, mimeType } = await visualizeOutfit({
      bodyPhotoUrl,
      items: visualizeItems,
      context: context_ || undefined,
      quality,
    });

    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${user.id}/${outfitId}/lookbook.${ext}`;

    const admin = createAdminClient();
    const { error: uploadErr } = await admin.storage
      .from("lookbooks")
      .upload(path, imageBytes, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const url = `${admin.storage.from("lookbooks").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;

    const { error: updateErr } = await admin
      .from("outfits")
      .update({ lookbook_url: url })
      .eq("id", outfitId);
    if (updateErr) throw updateErr;

    return NextResponse.json({ lookbook_url: url });
  } catch (err) {
    console.error("[visualize] failed:", err);
    const message = err instanceof Error ? err.message : "Visualization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
