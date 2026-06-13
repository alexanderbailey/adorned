import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPalette } from "@/lib/claude/extract-palette";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { logAiUsage } from "@/lib/usage";
import { assertActiveSubscription } from "@/lib/billing/gate";

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

  // Onboarding AI calls are free with any active subscription (no decrement).
  const sub = await assertActiveSubscription(user.id);
  if (!sub.ok) return sub.response;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const mediaType = ACCEPTED.has(file.type)
    ? (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif")
    : "image/jpeg";

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const started = Date.now();
  try {
    const result = await extractPalette(base64, mediaType);
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: result.model,
      operation: "extract_palette",
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedInputTokens: result.cachedInputTokens,
      inputBytes: bytes.byteLength,
      durationMs: Date.now() - started,
      status: "success",
      metadata: { swatch_count: result.swatches.length },
    });
    return NextResponse.json({ swatches: result.swatches });
  } catch (err) {
    console.error("[palette/extract] failed:", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      operation: "extract_palette",
      inputBytes: bytes.byteLength,
      durationMs: Date.now() - started,
      status: "error",
      errorMessage: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
