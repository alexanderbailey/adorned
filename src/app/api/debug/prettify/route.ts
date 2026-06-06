import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowlist";

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MODELS = {
  standard: "gemini-2.5-flash-image",
  advanced: "gemini-3-pro-image",
} as const;

export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isEmailAllowed(user.email)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const prompt = form.get("prompt");
  const model = form.get("model");
  const temperature = form.get("temperature");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }
  const modelKey = (model === "advanced" ? "advanced" : "standard") as keyof typeof MODELS;
  const modelId = MODELS[modelKey];

  const mediaType = ACCEPTED.has(file.type)
    ? (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif")
    : "image/jpeg";

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    const config: { temperature?: number } = {};
    if (typeof temperature === "string" && temperature.length > 0) {
      const t = parseFloat(temperature);
      if (!Number.isNaN(t)) config.temperature = t;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mediaType, data: base64 } },
          ],
        },
      ],
      ...(Object.keys(config).length > 0 ? { config } : {}),
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let outImage: { mimeType: string; data: string } | null = null;
    let outText = "";
    for (const part of parts) {
      if (part.inlineData?.data) {
        outImage = {
          mimeType: part.inlineData.mimeType ?? "image/png",
          data: part.inlineData.data,
        };
      } else if (part.text) {
        outText += part.text;
      }
    }
    if (!outImage) {
      return NextResponse.json(
        { error: "Model returned no image", text: outText, elapsedMs: Date.now() - started },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:${outImage.mimeType};base64,${outImage.data}`,
      mimeType: outImage.mimeType,
      bytes: Math.round((outImage.data.length * 3) / 4),
      text: outText || null,
      model: modelId,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    console.error("[debug/prettify] failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed",
        elapsedMs: Date.now() - started,
      },
      { status: 500 }
    );
  }
}
