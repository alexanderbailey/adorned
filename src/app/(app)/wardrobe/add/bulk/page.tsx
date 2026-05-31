"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { removeBackground, generateThumb } from "@/lib/bg-removal";
import { uploadViaApi } from "@/lib/upload";
import { normalizeImage } from "@/lib/normalize-image";
import type { ItemTags } from "@/lib/claude/tag-item";

const CONCURRENCY = 3;

type ItemStatus =
  | { kind: "queued" }
  | { kind: "removing"; progress: number }
  | { kind: "uploading" }
  | { kind: "tagging" }
  | { kind: "ready" }
  | { kind: "failed"; error: string };

interface QueueItem {
  id: string;
  itemId: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  payload?: ReadyPayload;
}

interface ReadyPayload {
  itemId: string;
  originalImageUrl: string;
  cutoutImageUrl: string;
  thumbImageUrl: string | null;
  tags: ItemTags;
}

type Mode = "picking" | "processing" | "reviewing" | "saving" | "done";

export default function BulkAddPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueueItem[]>([]);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [mode, setMode] = useState<Mode>("picking");

  // Sync ref so async workers can mutate without stale closures.
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Revoke preview URLs on unmount.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<QueueItem>) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
      );
    },
    []
  );

  const handlePick = useCallback(
    async (files: FileList) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;

      const queue: QueueItem[] = images.map((file) => ({
        id: crypto.randomUUID(),
        itemId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: { kind: "queued" },
      }));

      setItems(queue);
      setMode("processing");

      // Worker pool — at most CONCURRENCY items running at once.
      let cursor = 0;
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        while (cursor < queue.length) {
          const idx = cursor++;
          await processItem(queue[idx], updateItem);
        }
      });
      await Promise.all(workers);
    },
    [updateItem]
  );

  const readyCount = items.filter((i) => i.status.kind === "ready").length;
  const failedCount = items.filter((i) => i.status.kind === "failed").length;
  const doneCount = readyCount + failedCount;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header
        title={
          mode === "picking"
            ? "Add many"
            : mode === "processing"
              ? "Processing"
              : mode === "reviewing"
                ? "Review"
                : "Saving"
        }
        backHref="/wardrobe/add"
      />

      {mode === "picking" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <p className="text-[14px] text-mid text-center max-w-[260px]">
            Pick a batch of clothing photos. Each one will be cut out and tagged before you review.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full max-w-[280px] h-12 bg-charcoal text-surface text-[15px] font-medium tracking-[-0.1px] rounded-[6px]"
          >
            Choose photos
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
        </div>
      )}

      {mode === "processing" && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4">
              <p className="text-[12px] text-mid font-mono tabular-nums">
                {doneCount} / {items.length} done · {readyCount} ready
                {failedCount > 0 && ` · ${failedCount} failed`}
              </p>
            </div>
            <div className="border-t border-hairline">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
          <Footer>
            <button
              onClick={() => setMode("reviewing")}
              disabled={readyCount === 0}
              className="w-full h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px] disabled:opacity-40"
            >
              {allDone
                ? `Review ${readyCount} item${readyCount === 1 ? "" : "s"}`
                : `Review ready (${readyCount})`}
            </button>
          </Footer>
        </>
      )}

      {mode === "reviewing" && (
        <ReviewStack
          items={items.filter((i) => i.status.kind === "ready" && i.payload)}
          onSaved={(savedCount) => {
            setMode("done");
            // Brief confirmation then bounce to wardrobe.
            setTimeout(() => router.push("/wardrobe"), savedCount > 0 ? 800 : 0);
          }}
          onSavingChange={(s) => setMode(s ? "saving" : "reviewing")}
        />
      )}

      {mode === "done" && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-mid">Saved.</p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Per-item processing pipeline (runs inside the worker pool)
// -----------------------------------------------------------------
async function processItem(
  item: QueueItem,
  update: (id: string, patch: Partial<QueueItem>) => void
) {
  try {
    // 0. Normalise to a Claude-safe format (HEIC/AVIF -> JPEG/PNG).
    const { file: normalized, hasAlpha } = await normalizeImage(item.file);

    // 1. Background removal — skip if the input already has transparency
    //    anywhere (running bg-removal on a cutout fills the holes with black).
    let cutoutBlob: Blob;
    if (hasAlpha) {
      update(item.id, { status: { kind: "uploading" } });
      cutoutBlob = normalized;
    } else {
      update(item.id, { status: { kind: "removing", progress: 0 } });
      cutoutBlob = await removeBackground(normalized, (p) => {
        const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
        update(item.id, { status: { kind: "removing", progress: pct } });
      });
    }
    const thumbBlob = await generateThumb(cutoutBlob);

    // 2. Upload to Supabase Storage via server route
    update(item.id, { status: { kind: "uploading" } });
    const cutoutExt = cutoutBlob.type === "image/png" ? "png" : "webp";
    const cutoutType = cutoutBlob.type || "image/webp";
    const origExt = normalized.type === "image/png" ? "png" : "jpg";
    const [originalUrl, cutoutUrl, thumbUrl] = await Promise.all([
      uploadViaApi("items", `${item.itemId}/original.${origExt}`, normalized, {
        contentType: normalized.type,
      }),
      uploadViaApi("items", `${item.itemId}/cutout.${cutoutExt}`, cutoutBlob, {
        contentType: cutoutType,
      }),
      uploadViaApi("items", `${item.itemId}/thumb.webp`, thumbBlob, {
        contentType: "image/webp",
      }).catch(() => null),
    ]);

    // 3. Claude Haiku tagging
    update(item.id, { status: { kind: "tagging" } });
    const tagRes = await fetch("/api/items/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cutout_image_url: cutoutUrl }),
    });
    if (!tagRes.ok) {
      const body = await tagRes.text();
      let detail = body;
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (parsed.error) detail = parsed.error;
      } catch {}
      throw new Error(`Tagging failed: ${detail.slice(0, 200)}`);
    }
    const tags: ItemTags = await tagRes.json();

    update(item.id, {
      status: { kind: "ready" },
      payload: {
        itemId: item.itemId,
        originalImageUrl: originalUrl,
        cutoutImageUrl: cutoutUrl,
        thumbImageUrl: thumbUrl,
        tags,
      },
    });
  } catch (err) {
    update(item.id, {
      status: {
        kind: "failed",
        error: err instanceof Error ? err.message : "Failed",
      },
    });
  }
}

// -----------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------
function Header({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-[54px] h-[98px] border-b border-hairline">
      <Link
        href={backHref}
        className="w-10 h-10 flex items-center justify-center text-charcoal"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </Link>
      <span className="text-[15px] font-semibold tracking-[-0.2px]">{title}</span>
      <div className="w-10" />
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-hairline pb-safe">{children}</div>
  );
}

function ItemRow({ item }: { item: QueueItem }) {
  const { status } = item;
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-hairline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          status.kind === "ready" && item.payload
            ? item.payload.cutoutImageUrl
            : item.previewUrl
        }
        alt=""
        className="w-12 h-16 object-cover rounded bg-surface-alt shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-charcoal truncate">{item.file.name}</p>
        <StatusLine status={status} />
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: ItemStatus }) {
  switch (status.kind) {
    case "queued":
      return <p className="text-[12px] text-mid">Queued</p>;
    case "removing":
      return (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-[3px] bg-hairline rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <span className="text-[11px] text-mid font-mono tabular-nums shrink-0">
            {status.progress}%
          </span>
        </div>
      );
    case "uploading":
      return <p className="text-[12px] text-mid">Uploading…</p>;
    case "tagging":
      return <p className="text-[12px] text-mid">Identifying…</p>;
    case "ready":
      return <p className="text-[12px] text-accent">Ready</p>;
    case "failed":
      return <p className="text-[12px] text-danger">Failed: {status.error}</p>;
  }
}

// -----------------------------------------------------------------
// Swipe review stack — one card per item; Save adds to batch, Skip discards.
// On finish, single .insert([...]) commits the batch.
// -----------------------------------------------------------------
function ReviewStack({
  items,
  onSaved,
  onSavingChange,
}: {
  items: QueueItem[];
  onSaved: (savedCount: number) => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [keepIds, setKeepIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const current = items[index];
  const isLast = index >= items.length - 1;

  async function commitAndFinish(nextKeepIds: Set<string>) {
    onSavingChange(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = items
        .filter((it) => nextKeepIds.has(it.id) && it.payload)
        .map((it) => {
          const p = it.payload!;
          return {
            id: p.itemId,
            user_id: user.id,
            original_image_url: p.originalImageUrl,
            cutout_image_url: p.cutoutImageUrl,
            thumb_image_url: p.thumbImageUrl,
            category: p.tags.category,
            subcategory: p.tags.subcategory,
            primary_color_hex: p.tags.primary_color_hex,
            primary_color_name: p.tags.primary_color_name,
            secondary_colors: p.tags.secondary_colors,
            material: p.tags.material,
            pattern: p.tags.pattern,
            season: p.tags.season,
            formality: p.tags.formality,
            palette_fit_tags: p.tags.palette_fit_tags,
            ai_description: p.tags.ai_description,
            archived: false,
          };
        });

      if (rows.length === 0) {
        onSaved(0);
        return;
      }

      const { error: dbError } = await supabase.from("items").insert(rows);
      if (dbError) throw dbError;
      onSaved(rows.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      onSavingChange(false);
    }
  }

  function advance(keep: boolean) {
    const next = new Set(keepIds);
    if (keep && current) next.add(current.id);
    setKeepIds(next);

    if (isLast) {
      commitAndFinish(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (!current || !current.payload) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-mid">Nothing to review.</p>
      </div>
    );
  }

  const tags = current.payload.tags;
  const keepCount = keepIds.size + (isLast ? 0 : 0); // running keep count for footer

  return (
    <>
      <div className="px-5 py-3 flex items-center justify-between border-b border-hairline">
        <span className="text-[12px] text-mid font-mono tabular-nums">
          {index + 1} / {items.length}
        </span>
        <span className="text-[12px] text-mid">
          {keepCount} keeping
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative w-full bg-[#F0EDE3] flex items-center justify-center border-b border-hairline"
          style={{ height: 320 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.payload.cutoutImageUrl}
            alt=""
            className="max-w-[200px] max-h-[280px] object-contain"
          />
        </div>

        <div className="px-5 py-4 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="w-[18px] h-[18px] rounded-full shrink-0"
              style={{
                background: tags.primary_color_hex,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
              }}
            />
            <p className="text-[15px] font-medium text-charcoal capitalize">
              {tags.subcategory || tags.category}
            </p>
          </div>
          <p className="text-[12px] text-mid uppercase tracking-[1.2px]">
            {tags.category} · {tags.primary_color_name} · {tags.formality}
          </p>
          {tags.ai_description && (
            <p className="text-[13px] leading-[1.55] text-charcoal pt-2">
              {tags.ai_description}
            </p>
          )}
          {error && <p className="text-[13px] text-danger pt-2">{error}</p>}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-hairline pb-safe flex gap-3">
        <button
          onClick={() => advance(false)}
          className="flex-1 h-12 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px]"
        >
          Skip
        </button>
        <button
          onClick={() => advance(true)}
          className="flex-1 h-12 bg-charcoal text-surface text-[15px] font-medium rounded-[6px]"
        >
          {isLast ? "Save & finish" : "Keep"}
        </button>
      </div>
    </>
  );
}
