import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tagItem } from "@/lib/claude/tag-item";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cutout_image_url } = body as { cutout_image_url: string };

  if (!cutout_image_url) {
    return NextResponse.json(
      { error: "cutout_image_url is required" },
      { status: 400 }
    );
  }

  const tags = await tagItem(cutout_image_url);
  return NextResponse.json(tags);
}
