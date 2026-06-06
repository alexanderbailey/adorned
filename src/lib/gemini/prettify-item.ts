import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface PrettifyOutput {
  imageBytes: Buffer;
  mimeType: string;
}

const PROMPT = [
  "Task: produce a clean product photograph of the clothing item shown in the image.",
  "",
  "REQUIRED:",
  "- Transparent background (no studio backdrop, no surface, no shadows on a backdrop).",
  "- Item facing forward, centred in the frame, oriented upright as it would be worn.",
  "- Smooth out visible creases and wrinkles so the garment lies flat as in a product shot.",
  "- A subtle soft shadow directly beneath the item is fine if it helps grounding, otherwise omit.",
  "",
  "MUST PRESERVE EXACTLY:",
  "- The exact colour and colour saturation. Do not brighten, recolour, or correct a colour cast.",
  "- The exact pattern, print, embroidery, beading, or surface detail.",
  "- The exact material/fabric and its surface texture.",
  "- The silhouette and proportions of the garment.",
  "- All design details: neckline, sleeve length and shape, collar, buttons, zippers, pockets, hem, slits, belt loops, etc.",
  "",
  "MUST NOT:",
  "- Add or remove decorative elements that are not in the source image.",
  "- Change the cut, length, or fit.",
  "- Output a different garment or stylise into an illustration.",
  "- Output text, labels, watermarks, mannequins, or hangers.",
  "",
  "Output: a single image, transparent background, clothing item only.",
].join("\n");

export async function prettifyItem(input: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}): Promise<PrettifyOutput> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          {
            inlineData: { mimeType: input.mediaType, data: input.imageBase64 },
          },
        ],
      },
    ],
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
