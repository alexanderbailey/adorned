import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface PrettifyOutput {
  imageBytes: Buffer;
  mimeType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

// Production prettify model. Advanced (Nano Banana Pro) — better identity
// preservation and instruction-following than the cheaper Standard tier;
// item photos are a one-off per item so the extra cost is acceptable.
const MODEL = "gemini-3-pro-image";

const PROMPT = `Task: produce a clean ecommerce product photograph of the clothing item or footwear shown in the image.

REQUIRED:

* Solid PURE WHITE (#FFFFFF) background. Do NOT render a transparent or checkerboard background.
* Item centred in the frame.
* Oriented upright as it would be worn.
* Smooth out visible creases and wrinkles so the item appears neat and professionally presented as in a product shot.
* No shadow behind or beneath the item.

GARMENTS:

* Display garments facing forward in a standard ecommerce product view.

FOOTWEAR:

* Display footwear in a natural 3/4 product view (approximately 20–30° rotation from straight-on).
* Both shoes or boots must be visible when a pair is shown in the source image.
* The heel, sole profile, toe shape, and upper must all be clearly visible.
* Position the footwear so the heel is visible from the side rather than hidden behind the shoe.
* Do not use a straight front-facing view.
* Do not crop, obscure, or hide the heel.
* For boots, ensure the shaft, heel, and toe are all clearly visible.
* Present footwear as it would appear in a premium ecommerce catalogue photograph.
* For footwear, these viewing-angle instructions take priority over all other orientation instructions.

MUST PRESERVE EXACTLY:

* The exact colour and colour saturation. Do not brighten, recolour, or correct a colour cast.
* The exact pattern, print, embroidery, beading, embellishments, or surface detail.
* The exact material/fabric and its surface texture.
* The silhouette and proportions of the item.
* All design details including neckline, sleeve length and shape, collar, buttons, zippers, pockets, hems, slits, belt loops, eyelets, laces, buckles, soles, heels, and stitching.

MUST NOT:

* Add, remove, invent, or modify any design element.
* Change the cut, length, shape, fit, proportions, or construction.
* Change the heel height, sole thickness, toe shape, shaft shape, or relative position of footwear components.
* Remove one shoe from a pair unless only one shoe is present in the source image.
* Output a different item or stylise it into an illustration.
* Output text, labels, watermarks, mannequins, models, hangers, props, or packaging.
* Add reflections, shadows, or decorative effects.

Output:

* A single image.
* Pure white (#FFFFFF) background.
* Item only.
* Professional ecommerce catalogue style.`;

export async function prettifyItem(input: {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  /** Optional per-item override, appended to the main prompt. */
  instructions?: string;
}): Promise<PrettifyOutput> {
  const fullPrompt = input.instructions?.trim()
    ? `${PROMPT}\n\nSPECIFIC INSTRUCTIONS FOR THIS IMAGE:\n${input.instructions.trim()}`
    : PROMPT;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: fullPrompt },
          {
            inlineData: { mimeType: input.mediaType, data: input.imageBase64 },
          },
        ],
      },
    ],
  });

  const usage = response.usageMetadata;
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        imageBytes: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/png",
        model: MODEL,
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
      };
    }
  }
  throw new Error("Gemini returned no image data");
}
