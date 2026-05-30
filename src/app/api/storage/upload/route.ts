import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_BUCKETS = new Set(["items", "inspo", "body"]);

export async function POST(request: Request) {
  // Auth check via the user's session — only their own folder is writable.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const bucket = form.get("bucket");
  const subpath = form.get("subpath");
  const upsert = form.get("upsert") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof bucket !== "string" || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }
  if (typeof subpath !== "string" || subpath.length === 0) {
    return NextResponse.json({ error: "Missing subpath" }, { status: 400 });
  }
  // Force the path to live under the user's own folder.
  const path = `${user.id}/${subpath}`;

  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert,
    });
  if (uploadErr) {
    return NextResponse.json(
      { error: uploadErr.message, path },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
