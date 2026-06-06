import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tagItem } from "@/lib/claude/tag-item";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { logAiUsage } from "@/lib/usage";

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
  const { cutout_image_url } = body as { cutout_image_url: string };

  if (!cutout_image_url) {
    return NextResponse.json(
      { error: "cutout_image_url is required" },
      { status: 400 }
    );
  }

  const started = Date.now();
  try {
    const result = await tagItem(cutout_image_url);
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: result.model,
      operation: "tag_item",
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedInputTokens: result.cachedInputTokens,
      durationMs: Date.now() - started,
      status: "success",
    });
    return NextResponse.json(result.tags);
  } catch (err) {
    console.error("[items/tag] failed:", err);
    const message = err instanceof Error ? err.message : "Tagging failed";
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: "claude-haiku-4-5",
      operation: "tag_item",
      durationMs: Date.now() - started,
      status: "error",
      errorMessage: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
