import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPalette } from "@/lib/claude/extract-palette";
import { isEmailAllowed } from "@/lib/auth/allowlist";

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

  try {
    const swatches = await extractPalette(base64, mediaType);
    return NextResponse.json({ swatches });
  } catch (err) {
    console.error("[palette/extract] failed:", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
