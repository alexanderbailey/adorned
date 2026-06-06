import Anthropic from "@anthropic-ai/sdk";
import type { PaletteSwatch } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You extract a colour palette from an image. The image is usually a curated palette (Pinterest-style grid of swatches, a colour-analysis chart, or a moodboard) and may have colour names written next to or on each swatch.

Rules:
- Extract every distinct intentional palette colour from the image. Don't merge similar colours — if the palette shows "dusty rose" and "rose" as separate swatches, return both.
- If the image contains text labels for colour names, use those names verbatim.
- If a swatch has no label, invent a short descriptive name (e.g. "muted sage", "warm coral", "icy lavender"). Never name a colour by its hex code or by a generic letter ("Color 1").
- Ignore the background, decorative elements, watermarks, white space — only the intentional palette colours.
- If the image is not recognisably a palette (a landscape photo, a person, etc.), do your best to extract a few dominant colours and invent names.

Return ONLY a JSON object with this exact shape (no markdown fences, no commentary):
{
  "swatches": [
    { "name": "<short colour name>", "hex": "#RRGGBB" },
    ...
  ]
}`;

export interface ExtractPaletteResult {
  swatches: PaletteSwatch[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

export async function extractPalette(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractPaletteResult> {
  const model = "claude-sonnet-4-6";
  const message = await client.messages.create({
    model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "Extract the palette from this image.",
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

  let parsed: { swatches?: PaletteSwatch[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed.swatches || !Array.isArray(parsed.swatches)) {
    throw new Error("Model did not return a swatches array");
  }

  // Light sanity filter — keep only entries with valid hex + non-empty name.
  const swatches = parsed.swatches.filter(
    (s) =>
      typeof s?.name === "string" &&
      s.name.trim().length > 0 &&
      typeof s?.hex === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(s.hex)
  );
  return {
    swatches,
    model,
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0,
    cachedInputTokens: message.usage?.cache_read_input_tokens ?? 0,
  };
}
