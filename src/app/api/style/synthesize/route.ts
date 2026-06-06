import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { synthesizeStyle } from "@/lib/claude/synthesize-style";
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
  const { description, inspo_image_urls } = body as {
    description: string;
    inspo_image_urls: string[];
  };

  if (
    (!description || description.trim().length === 0) &&
    (!inspo_image_urls || inspo_image_urls.length === 0)
  ) {
    return NextResponse.json(
      { error: "Provide a description or at least one inspiration image." },
      { status: 400 }
    );
  }

  const started = Date.now();
  try {
    const result = await synthesizeStyle(description ?? "", inspo_image_urls ?? []);
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: result.model,
      operation: "synthesize_style",
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedInputTokens: result.cachedInputTokens,
      durationMs: Date.now() - started,
      status: "success",
      metadata: { inspo_count: (inspo_image_urls ?? []).length },
    });
    return NextResponse.json({ summary: result.summary });
  } catch (err) {
    console.error("[synthesize] failed:", err);
    const message = err instanceof Error ? err.message : "Synthesis failed";
    await logAiUsage({
      userId: user.id,
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      operation: "synthesize_style",
      durationMs: Date.now() - started,
      status: "error",
      errorMessage: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
