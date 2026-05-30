import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { synthesizeStyle } from "@/lib/claude/synthesize-style";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const summary = await synthesizeStyle(description ?? "", inspo_image_urls ?? []);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[synthesize] failed:", err);
    const message = err instanceof Error ? err.message : "Synthesis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
