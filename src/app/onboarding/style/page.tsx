"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Phase = "input" | "synthesizing" | "review";

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

const MIN_INSPO = 0;
const MAX_INSPO = 20;

export default function StylePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("input");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<PendingImage[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("style_description, style_summary, onboarded_at")
        .eq("id", user.id)
        .single();
      if (profile?.onboarded_at) setIsEditing(true);
      if (profile?.style_description) setDescription(profile.style_description);
      if (profile?.style_summary) {
        setSummary(profile.style_summary);
        // If they already have a summary, jump straight to review so they can edit.
        setPhase("review");
      }
    })();
  }, []);

  const handlePick = useCallback((files: FileList) => {
    const incoming = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_INSPO);
    setImages((prev) => {
      const remaining = MAX_INSPO - prev.length;
      const next = incoming.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
  }, []);

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleContinue() {
    if (!description.trim() && images.length === 0) {
      setError("Add a description or upload at least one inspiration photo.");
      return;
    }
    setWorking(true);
    setError(null);
    setPhase("synthesizing");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("[style] auth user.id:", user.id);

      // Upload inspo images via server route (service-role bypasses storage RLS issues).
      const uploaded = await Promise.all(
        images.map(async (img, position) => {
          const ext = img.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
          const form = new FormData();
          form.append("file", img.file);
          form.append("bucket", "inspo");
          form.append("subpath", `${img.id}.${ext}`);
          form.append("upsert", "true");
          const res = await fetch("/api/storage/upload", { method: "POST", body: form });
          if (!res.ok) {
            const detail = await res.text();
            throw new Error(`Upload failed (${img.file.name}): ${detail.slice(0, 200)}`);
          }
          const { url } = (await res.json()) as { url: string };
          return { url, position };
        })
      );

      // Replace inspo rows for this user — keeps retries and re-edits idempotent.
      const { error: deleteErr } = await supabase
        .from("inspo_images")
        .delete()
        .eq("user_id", user.id);
      if (deleteErr) {
        console.error("[style] inspo delete failed:", deleteErr);
        throw new Error(`Inspo delete failed: ${deleteErr.message}`);
      }

      if (uploaded.length > 0) {
        const { error: insertErr } = await supabase.from("inspo_images").insert(
          uploaded.map((u) => ({
            user_id: user.id,
            image_url: u.url,
            position: u.position,
          }))
        );
        if (insertErr) {
          console.error("[style] inspo_images insert failed:", insertErr);
          throw new Error(`Inspo insert failed: ${insertErr.message}`);
        }
      }

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ style_description: description.trim() || null })
        .eq("id", user.id);
      if (profileErr) {
        console.error("[style] profiles update failed:", profileErr);
        throw new Error(`Profile update failed: ${profileErr.message}`);
      }

      // Call Claude to synthesize
      const res = await fetch("/api/style/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          inspo_image_urls: uploaded.map((u) => u.url),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try {
          const parsed = JSON.parse(body) as { error?: string };
          if (parsed.error) detail = parsed.error;
        } catch {
          // not JSON — keep raw text
        }
        throw new Error(`Synthesis failed (${res.status}): ${detail.slice(0, 200)}`);
      }
      const json = (await res.json()) as { summary: string };
      setSummary(json.summary);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("input");
    } finally {
      setWorking(false);
    }
  }

  async function handleSaveSummary() {
    setWorking(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ style_summary: summary.trim() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      router.push(isEditing ? "/profile" : "/onboarding/body");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setWorking(false);
    }
  }

  if (phase === "synthesizing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-accent animate-spin" />
        <p className="text-[14px] text-mid">Reading your inspo…</p>
        <p className="text-[12px] text-mid text-center max-w-[260px]">
          This usually takes 10-30 seconds depending on how many images you uploaded.
        </p>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          <p className="text-[14px] text-mid">
            Here&apos;s how I&apos;d describe your style. Tweak it until it feels right.
          </p>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={14}
            className="w-full p-4 text-[14px] leading-[1.6] text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal resize-vertical"
          />
        </div>
        <div className="px-5 py-4 border-t border-hairline">
          {error && <p className="text-[13px] text-danger mb-2">{error}</p>}
          <button
            onClick={handleSaveSummary}
            disabled={working || !summary.trim()}
            className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
          >
            {working ? "Saving…" : isEditing ? "Save" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <section className="space-y-2">
          <label className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
            Describe your style
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="E.g. mostly muted neutrals, a lot of linen and wool, soft tailoring, occasional bold colour for accessories…"
            className="w-full p-3 text-[14px] leading-[1.55] text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal resize-vertical"
          />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Inspiration photos
            </label>
            <span className="text-[11px] text-mid font-mono tabular-nums">
              {images.length} / {MAX_INSPO}
            </span>
          </div>
          <p className="text-[12px] text-mid">
            Outfits, looks, or moods you love. 5-20 works best.
          </p>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square bg-surface-alt rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-charcoal/80 text-canvas rounded-full"
                    aria-label="Remove"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={images.length >= MAX_INSPO}
            className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px] disabled:opacity-30"
          >
            {images.length === 0 ? "Choose photos" : "Add more"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handlePick(e.target.files);
              e.target.value = "";
            }}
          />
        </section>
      </div>

      <div className="px-5 py-4 border-t border-hairline">
        {error && <p className="text-[13px] text-danger mb-2">{error}</p>}
        <button
          onClick={handleContinue}
          disabled={
            working ||
            (description.trim().length === 0 && images.length < MIN_INSPO + 1 && images.length === 0)
          }
          className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
