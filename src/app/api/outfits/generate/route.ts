import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateOutfits,
  type WardrobeItemForGen,
  type ProfileForGen,
} from "@/lib/claude/generate-outfit";
import type { PaletteSwatch, PromptChips } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { prompt, chips } = body as { prompt?: string; chips?: PromptChips };

  if ((!prompt || prompt.trim().length === 0) && !chips) {
    return NextResponse.json(
      { error: "Provide a prompt or at least one chip." },
      { status: 400 }
    );
  }

  // Load profile + wardrobe in parallel
  const [profileRes, itemsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("style_summary, palette_preset, palette_swatches")
      .eq("id", user.id)
      .single(),
    supabase
      .from("items")
      .select(
        "id, category, subcategory, ai_description, primary_color_name, season, formality"
      )
      .eq("user_id", user.id)
      .eq("archived", false),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }
  if (itemsRes.error) {
    return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
  }

  const profile: ProfileForGen = {
    style_summary: profileRes.data?.style_summary ?? null,
    palette_preset: profileRes.data?.palette_preset ?? null,
    palette_swatches: (profileRes.data?.palette_swatches ?? []) as PaletteSwatch[],
  };

  const wardrobe: WardrobeItemForGen[] = (itemsRes.data ?? []).map((it) => ({
    item_id: it.id,
    category: it.category,
    subcategory: it.subcategory,
    ai_description: it.ai_description,
    primary_color_name: it.primary_color_name,
    season: it.season,
    formality: it.formality,
  }));

  if (wardrobe.length === 0) {
    return NextResponse.json(
      { error: "Your wardrobe is empty — add items before generating outfits." },
      { status: 400 }
    );
  }

  try {
    const outfits = await generateOutfits({
      prompt: prompt ?? "",
      chips,
      profile,
      wardrobe,
    });
    return NextResponse.json({ outfits });
  } catch (err) {
    console.error("[generate-outfits] failed:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
