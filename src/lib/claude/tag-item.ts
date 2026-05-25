import Anthropic from "@anthropic-ai/sdk";
import type { ItemCategory, ItemFormality, ItemSeason, SecondaryColor } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ItemTags {
  category: ItemCategory;
  subcategory: string;
  primary_color_hex: string;
  primary_color_name: string;
  secondary_colors: SecondaryColor[];
  material: string;
  pattern: string;
  season: ItemSeason[];
  formality: ItemFormality;
  ai_description: string;
  palette_fit_tags: string[];
}

const SYSTEM_PROMPT = `You are a fashion expert analysing clothing items for a wardrobe app.
Given an image of a clothing item (cutout on a plain background), return a JSON object with exactly these fields:

{
  "category": one of: tops | bottoms | skirts | dresses | outerwear | shoes | bags | accessories | jewellery,
  "subcategory": freeform string e.g. "blouse", "straight-leg jeans", "ankle boot",
  "primary_color_hex": dominant hex colour e.g. "#8B6F5E",
  "primary_color_name": natural language colour name e.g. "warm caramel",
  "secondary_colors": array of { "name": string, "hex": string } for up to 3 other colours,
  "material": e.g. "wool blend", "cotton canvas", "patent leather",
  "pattern": e.g. "solid", "stripe", "check", "floral", "textured",
  "season": array of one or more: spring | summer | fall | winter,
  "formality": one of: casual | smart-casual | formal,
  "ai_description": 1-2 sentence styling description from the perspective of a stylist,
  "palette_fit_tags": array of tags e.g. ["warm-toned", "neutral", "matches:dusty-rose"]
}

Respond with ONLY the JSON object. No markdown fences, no extra text.`;

export async function tagItem(imageUrl: string): Promise<ItemTags> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: "Analyse this clothing item and return the JSON.",
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return JSON.parse(text) as ItemTags;
}
