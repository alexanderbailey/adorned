import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { prettifyItem } from "@/lib/gemini/prettify-item";
import { logAiUsage } from "@/lib/usage";

// Gemini image gen can take 15-30s. Bump max function duration.
export const maxDuration = 60;

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
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

  const body = await request.json();
  const { source_image_url, item_id } = body as {
    source_image_url?: string;
    item_id?: string;
  };

  if (!source_image_url) {
    return NextResponse.json(
      { error: "source_image_url is required" },
      { status: 400 }
    );
  }
  if (!item_id) {
    return NextResponse.json(
      { error: "item_id is required (used as the storage path)" },
      { status: 400 }
    );
  }

  const started = Date.now();
  let srcByteLength = 0;
  try {
    // Fetch the source image, base64 it for Gemini.
    const srcRes = await fetch(source_image_url);
    if (!srcRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch source (${srcRes.status})` },
        { status: 400 }
      );
    }
    const srcCT = (srcRes.headers.get("content-type") ?? "image/jpeg").split(";")[0];
    const mediaType = (ACCEPTED.has(srcCT)
      ? srcCT
      : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    const srcBytes = Buffer.from(await srcRes.arrayBuffer());
    srcByteLength = srcBytes.byteLength;

    const { imageBytes, mimeType, model, inputTokens, outputTokens } = await prettifyItem({
      imageBase64: srcBytes.toString("base64"),
      mediaType,
    });

    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${user.id}/${item_id}/cutout.${ext}`;

    const admin = createAdminClient();
    const { error: uploadErr } = await admin.storage
      .from("items")
      .upload(path, imageBytes, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const url = `${admin.storage.from("items").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    await logAiUsage({
      userId: user.id,
      provider: "google",
      model,
      operation: "prettify_item",
      inputTokens,
      outputTokens,
      inputBytes: srcByteLength,
      outputBytes: imageBytes.byteLength,
      durationMs: Date.now() - started,
      status: "success",
      metadata: { item_id },
    });
    return NextResponse.json({ cutout_url: url });
  } catch (err) {
    console.error("[items/prettify] failed:", err);
    const message = err instanceof Error ? err.message : "Prettify failed";
    await logAiUsage({
      userId: user.id,
      provider: "google",
      model: "gemini-2.5-flash-image",
      operation: "prettify_item",
      inputBytes: srcByteLength,
      durationMs: Date.now() - started,
      status: "error",
      errorMessage: message,
      metadata: { item_id },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
