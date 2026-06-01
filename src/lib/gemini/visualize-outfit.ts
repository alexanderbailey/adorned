import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface VisualizeInput {
  /** URL of the person's body reference photo. */
  bodyPhotoUrl: string;
  /** URLs of each item's cutout (transparent background, single garment). */
  itemCutoutUrls: string[];
  /** Optional stylist notes / occasion to add context to the composition. */
  context?: string;
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
    input.itemCutoutUrls.map((u) => fetchAsInlineData(u))
  );

  const promptText = [
    "Generate a photo-realistic, full-body image of the person in the first photo wearing the clothing items in the following photos.",
    "Compose the items together as a complete outfit. Preserve the person's face, hair, body shape, and skin tone exactly.",
    "Match each garment's colour, pattern, and material as accurately as possible.",
    "Place the person against a neutral, softly-lit studio backdrop (warm off-white).",
    "Photo-realistic lighting, natural pose, fashion-editorial framing.",
    input.context ? `\nContext for styling: ${input.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: promptText }, bodyPart, ...itemParts] }],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        imageBytes: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }
  throw new Error("Gemini returned no image data");
}
