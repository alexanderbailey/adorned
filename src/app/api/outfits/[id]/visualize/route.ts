import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { visualizeOutfit } from "@/lib/gemini/visualize-outfit";
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

// Rewrites a Supabase public object URL into a render-with-transform URL so
// the image is served pre-resized. Helps keep Gemini latency under Vercel's
// function timeout when the user's body photo is a large phone snap.
function supabaseResized(url: string, width: number): string {
  return url.replace(
    "/storage/v1/object/public/",
    `/storage/v1/render/image/public/`
  ) + (url.includes("?") ? "&" : "?") + `width=${width}&resize=contain`;
}

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
  const itemCutoutUrls = outfit.outfit_items
    .map((oi) => oi.items?.thumb_image_url ?? oi.items?.cutout_image_url)
    .filter((u): u is string => !!u);
  if (itemCutoutUrls.length === 0) {
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
      bodyPhotoUrl: supabaseResized(bodyPhotoUrl, 640),
      itemCutoutUrls,
      context: context_ || undefined,
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
