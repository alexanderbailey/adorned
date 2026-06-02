import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface VisualizeItem {
  url: string;
  /** What kind of garment this image represents — e.g. "top", "skirt". */
  label: string;
}

// Quality tiers — also the place to wire in the future fashion-token cost.
// Add new tiers here; client + route both reference this list.
export const QUALITY_TIERS = {
  standard: { model: "gemini-2.5-flash-image", label: "Standard" },
  high:     { model: "gemini-3-pro-image",     label: "High quality" },
} as const;
export type QualityTier = keyof typeof QUALITY_TIERS;

export interface VisualizeInput {
  /** URL of the person's body reference photo. */
  bodyPhotoUrl: string;
  /** Each item's cutout image + a label (category/subcategory). */
  items: VisualizeItem[];
  /** Optional stylist notes / occasion to add context to the composition. */
  context?: string;
  /** Which model to use; defaults to standard. */
  quality?: QualityTier;
}

export interface VisualizeOutput {
  imageBytes: Buffer;
  mimeType: string;
}

async function fetchAsInlineData(url: string): Promise<{
  inlineData: { mimeType: string; data: string };
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    inlineData: {
      mimeType: contentType.split(";")[0],
      data: buf.toString("base64"),
    },
  };
}

export async function visualizeOutfit(
  input: VisualizeInput
): Promise<VisualizeOutput> {
  const bodyPart = await fetchAsInlineData(input.bodyPhotoUrl);
  const itemParts = await Promise.all(
    input.items.map((it) => fetchAsInlineData(it.url))
  );

  // Build interleaved parts: a header text, the body photo (labelled), then
  // each item image preceded by its category label. Gemini handles multi-image
  // composition better when each image is named.
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  parts.push({
    text: [
      "Task: produce a photo-realistic, full-body editorial image of the SAME PERSON shown in the reference photo, now wearing the clothing items shown in the following images.",
      "",
      "CRITICAL IDENTITY RULES:",
      "- The person in the output MUST be the same individual as in the reference photo. Match her face shape, eye colour, eye shape, nose, mouth, complexion, hair colour, hair texture (e.g. curl pattern), hair length, and any visible glasses or accessories. Do NOT generalise to a model.",
      "- Match her body shape and proportions, height, and build exactly. Do not idealise or slim.",
      "- Match her skin tone exactly.",
      "",
      "GARMENT COMPOSITION RULES:",
      "- Each subsequent image is a SEPARATE garment, labelled by category. They form ONE complete outfit together.",
      "- Do NOT merge a top and a skirt into a dress, or a top and trousers into a jumpsuit. A top tucks into or sits over a skirt/trousers at the waist; they remain distinct garments.",
      "- A dress is a single garment from shoulders to hem.",
      "- Render each garment with its exact colour, pattern, material, and silhouette as shown in its image.",
      "- Place shoes on the feet. Place bags/jewellery as a person would naturally hold/wear them.",
      "",
      "SCENE & FRAMING:",
      "- Neutral, softly-lit studio backdrop (warm off-white, light cream, or pale taupe).",
      "- Natural standing pose.",
      "- FULL-BODY FRAMING: the output image must show the entire person from the very top of her head (including all hair, hats, or accessories) down to BELOW her feet. Leave a small margin of empty backdrop above the head and below the feet. The head must NOT be cropped or touch the top edge. The feet must NOT be cropped or touch the bottom edge.",
      "- Portrait orientation (taller than wide), roughly 3:4 aspect.",
      "- Photo-realistic lighting, soft shadows, fashion-editorial framing.",
      input.context ? `\nStyling context: ${input.context}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  parts.push({ text: "Reference photo of the person:" });
  parts.push({ inlineData: bodyPart.inlineData });

  for (let i = 0; i < input.items.length; i++) {
    parts.push({ text: `Item ${i + 1} — ${input.items[i].label}:` });
    parts.push({ inlineData: itemParts[i].inlineData });
  }

  parts.push({ text: "Generate the final composed image now." });

  const tier = QUALITY_TIERS[input.quality ?? "standard"];
  const response = await ai.models.generateContent({
    model: tier.model,
    contents: [{ role: "user", parts }],
  });

  const outParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of outParts) {
    if (part.inlineData?.data) {
      return {
        imageBytes: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }
  throw new Error("Gemini returned no image data");
}
