"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserIcon } from "@heroicons/react/24/outline";

export default function BodyPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("body_photo_url, onboarded_at")
        .eq("id", user.id)
        .single();
      if (profile?.onboarded_at) setIsEditing(true);
      if (profile?.body_photo_url) setExistingPhotoUrl(profile.body_photo_url);
    })();
  }, []);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleFinish() {
    setFinishing(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Keep existing photo if no new one was picked.
      let bodyPhotoUrl: string | null = existingPhotoUrl;

      if (pendingFile) {
        const ext = pendingFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const form = new FormData();
        form.append("file", pendingFile);
        form.append("bucket", "body");
        form.append("subpath", `reference.${ext}`);
        form.append("upsert", "true");
        const res = await fetch("/api/storage/upload", { method: "POST", body: form });
        if (!res.ok) {
          const detail = await res.text();
          throw new Error(`Upload failed: ${detail.slice(0, 200)}`);
        }
        const { url } = (await res.json()) as { url: string };
        bodyPhotoUrl = url;
      }

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({
          body_photo_url: bodyPhotoUrl,
          onboarded_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      router.push(isEditing ? "/profile" : "/wardrobe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setFinishing(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <p className="text-[14px] text-mid">
          A single reference photo of you — used later for try-on previews. Skippable for now.
        </p>

        {previewUrl || existingPhotoUrl ? (
          <div className="space-y-3">
            <div className="w-full max-w-[260px] mx-auto aspect-[3/4] bg-surface-alt rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl ?? existingPhotoUrl!}
                alt="Body reference"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="block mx-auto text-[13px] text-mid underline underline-offset-2"
            >
              Replace photo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-[140px] h-[180px] bg-surface-alt rounded flex items-center justify-center text-mid">
              <UserIcon className="w-10 h-10" />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="h-12 px-6 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px]"
            >
              Add a photo
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="px-5 py-4 border-t border-hairline">
        {error && <p className="text-[13px] text-danger mb-2">{error}</p>}
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
        >
          {finishing
            ? "Saving…"
            : isEditing
              ? "Save"
              : pendingFile
                ? "Finish onboarding"
                : "Skip and finish"}
        </button>
      </div>
    </div>
  );
}
