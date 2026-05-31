import Anthropic from "@anthropic-ai/sdk";
import type {
  ItemCategory,
  ItemFormality,
  ItemSeason,
  PaletteSwatch,
  PromptChips,
} from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface WardrobeItemForGen {
  item_id: string;
  category: ItemCategory;
  subcategory: string | null;
  ai_description: string | null;
  primary_color_name: string | null;
  season: ItemSeason[] | null;
  formality: ItemFormality | null;
}

export interface ProfileForGen {
  style_summary: string | null;
  palette_preset: string | null;
  palette_swatches: PaletteSwatch[];
}

export interface GeneratedOutfit {
  item_ids: string[];
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a personal stylist. Given a person's stated style, colour palette, and complete wardrobe, propose 3 distinct outfits that match a request.

Rules:
- Each outfit MUST consist only of items from the supplied wardrobe (use the exact item_id values).
- Each outfit should be wearable as a complete look: typically a top + bottom (or a dress), shoes, and 0-2 accessories. Don't include multiple tops or multiple bottoms in one outfit unless layering (e.g. blazer over a top).
- Choose items that suit the person's stated style and palette unless the request explicitly overrides it.
- Make the 3 outfits genuinely distinct from each other — different silhouettes, colour stories, or moods. Don't just swap one item.
- Reasoning is 1-2 sentences, written in the second person ("you"), explaining WHY this outfit fits the request and the person's style.

Output a JSON object with this exact shape (no markdown fences, no commentary):
{
  "outfits": [
    { "item_ids": ["<id>", "<id>", ...], "reasoning": "..." },
    { "item_ids": [...], "reasoning": "..." },
    { "item_ids": [...], "reasoning": "..." }
  ]
}`;

function formatProfile(profile: ProfileForGen): string {
  const lines: string[] = [];
  if (profile.style_summary) {
    lines.push(`Style summary:\n${profile.style_summary}`);
  }
  if (profile.palette_swatches.length > 0) {
    const swatches = profile.palette_swatches
      .map((s) => `${s.name} (${s.hex})`)
      .join(", ");
    lines.push(
      `Palette: ${swatches}`
    );
  }
  return lines.join("\n\n") || "(no profile data)";
}

function formatWardrobe(items: WardrobeItemForGen[]): string {
  if (items.length === 0) return "(empty wardrobe)";
  return items
    .map((i) => {
      const parts = [
        `item_id=${i.item_id}`,
        `category=${i.category}`,
        i.subcategory ? `subcategory=${i.subcategory}` : null,
        i.primary_color_name ? `color=${i.primary_color_name}` : null,
        i.formality ? `formality=${i.formality}` : null,
        i.season && i.season.length > 0 ? `season=${i.season.join("/")}` : null,
        i.ai_description ? `description=${JSON.stringify(i.ai_description)}` : null,
      ].filter(Boolean);
      return `- ${parts.join("; ")}`;
    })
    .join("\n");
}

function formatRequest(prompt: string, chips: PromptChips | undefined): string {
  const parts: string[] = [];
  if (prompt.trim()) parts.push(`Prompt: ${prompt.trim()}`);
  if (chips) {
    const chipLines = Object.entries(chips)
      .filter(([, v]) => v && v !== "")
      .map(([k, v]) => `${k}: ${v}`);
    if (chipLines.length > 0) parts.push(chipLines.join(" · "));
  }
  if (parts.length === 0) parts.push("(no specific occasion — pick 3 versatile looks)");
  return parts.join("\n");
}

export async function generateOutfits(input: {
  prompt: string;
  chips?: PromptChips;
  profile: ProfileForGen;
  wardrobe: WardrobeItemForGen[];
}): Promise<GeneratedOutfit[]> {
  const profileBlock = formatProfile(input.profile);
  const wardrobeBlock = formatWardrobe(input.wardrobe);
  const requestBlock = formatRequest(input.prompt, input.chips);

  // Cache the stable parts (profile + wardrobe) so regenerations are cheap.
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `=== Person profile ===\n${profileBlock}\n\n=== Wardrobe ===\n${wardrobeBlock}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `=== Request ===\n${requestBlock}\n\nReturn the JSON now.`,
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();

  let parsed: { outfits?: GeneratedOutfit[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    // Sometimes the model still wraps it in fences despite instructions — strip them.
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    parsed = JSON.parse(cleaned);
  }
  if (!parsed.outfits || !Array.isArray(parsed.outfits)) {
    throw new Error("Model did not return an outfits array");
  }

  const allowed = new Set(input.wardrobe.map((i) => i.item_id));
  return parsed.outfits.map((o) => ({
    item_ids: (o.item_ids ?? []).filter((id) => allowed.has(id)),
    reasoning: o.reasoning ?? "",
  }));
}
