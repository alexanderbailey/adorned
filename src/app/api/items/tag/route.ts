import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tagItem } from "@/lib/claude/tag-item";
import { isEmailAllowed } from "@/lib/auth/allowlist";

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

  try {
    const tags = await tagItem(cutout_image_url);
    return NextResponse.json(tags);
  } catch (err) {
    console.error("[items/tag] failed:", err);
    const message = err instanceof Error ? err.message : "Tagging failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
