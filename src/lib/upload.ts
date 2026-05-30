// Client helper: uploads a Blob/File via the server route (which uses
// service_role to bypass storage RLS quirks). Returns the resulting public URL.

export async function uploadViaApi(
  bucket: "items" | "inspo" | "body",
  subpath: string,
  blob: Blob,
  opts: { upsert?: boolean; contentType?: string; filename?: string } = {}
): Promise<string> {
  const file =
    blob instanceof File
      ? blob
      : new File([blob], opts.filename ?? "blob", {
          type: opts.contentType ?? blob.type ?? "application/octet-stream",
        });

  const form = new FormData();
  form.append("file", file);
  form.append("bucket", bucket);
  form.append("subpath", subpath);
  if (opts.upsert) form.append("upsert", "true");

  const res = await fetch("/api/storage/upload", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Upload failed (${bucket}/${subpath}): ${detail.slice(0, 200)}`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
