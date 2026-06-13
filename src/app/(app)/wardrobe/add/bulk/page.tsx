"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadViaApi } from "@/lib/upload";
import { normalizeImage } from "@/lib/normalize-image";
import { prettifyViaApi } from "@/lib/prettify-client";
import { Icon } from "@/components/Icon";
import { extractErrorMessage } from "@/lib/error";
import { clsx } from "clsx";
import type { ItemTags } from "@/lib/claude/tag-item";
import type { ItemCategory, ItemFormality, ItemSeason } from "@/lib/types";
import { useEntitlements } from "@/lib/billing/useEntitlements";
import { OutOfCreditModal } from "@/components/billing/OutOfCreditModal";

const CATEGORIES: ItemCategory[] = [
  "tops", "bottoms", "skirts", "dresses", "outerwear",
  "shoes", "bags", "accessories", "jewellery",
];
const SEASONS: { value: ItemSeason; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall",   label: "Autumn" },
  { value: "winter", label: "Winter" },
];
const FORMALITIES: ItemFormality[] = ["casual", "smart-casual", "formal"];

const CONCURRENCY = 3;

type ItemStatus =
  | { kind: "queued" }
  | { kind: "uploading" }
  | { kind: "prettifying" }
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
  const { data: entitlements, refresh: refreshEntitlements } = useEntitlements();
  const [showTopupModal, setShowTopupModal] = useState(false);

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

  const startProcessing = useCallback(
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
      void refreshEntitlements();
    },
    [updateItem, refreshEntitlements]
  );

  // Pre-check: refuse to start if the batch exceeds available wardrobe credits.
  // (The server would refuse mid-batch anyway, but we'd rather not waste any.)
  const handlePick = useCallback(
    (files: FileList) => {
      const imageCount = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      ).length;
      const available = entitlements?.wardrobeCreditsTotal ?? Infinity;
      if (imageCount > available) {
        setShowTopupModal(true);
        return;
      }
      void startProcessing(files);
    },
    [entitlements, startProcessing]
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

      {mode === "picking" && entitlements && (
        <p className="px-6 pb-4 text-[11px] text-mid text-center">
          {entitlements.wardrobeCreditsTotal} wardrobe additions available
        </p>
      )}

      {showTopupModal && (
        <OutOfCreditModal
          resource="wardrobe_add"
          onClose={() => setShowTopupModal(false)}
        />
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
    // 0. Normalise + downsize (HEIC/AVIF -> JPEG/PNG, max 1920px).
    const { file: normalized } = await normalizeImage(item.file);

    // 1. Upload the normalised original to storage.
    update(item.id, { status: { kind: "uploading" } });
    const origExt = normalized.type === "image/png" ? "png" : "jpg";
    const originalUrl = await uploadViaApi(
      "items",
      `${item.itemId}/original.${origExt}`,
      normalized,
      { contentType: normalized.type }
    );

    // 2. Gemini prettify: bg removal + straighten + smooth creases.
    update(item.id, { status: { kind: "prettifying" } });
    const cutoutUrl = await prettifyViaApi(item.itemId, originalUrl);

    // 3. Claude Haiku tagging on the prettified image.
    update(item.id, { status: { kind: "tagging" } });
    const tagRes = await fetch("/api/items/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cutout_image_url: cutoutUrl }),
    });
    if (!tagRes.ok) {
      const body = await tagRes.text();
      const detail = extractErrorMessage(body) || `HTTP ${tagRes.status}`;
      throw new Error(`Tagging failed: ${detail.slice(0, 200)}`);
    }
    const tags: ItemTags = await tagRes.json();

    update(item.id, {
      status: { kind: "ready" },
      payload: {
        itemId: item.itemId,
        originalImageUrl: originalUrl,
        cutoutImageUrl: cutoutUrl,
        thumbImageUrl: null,
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
        <Icon name="close" size={22} />
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
    case "uploading":
      return <p className="text-[12px] text-mid">Uploading…</p>;
    case "prettifying":
      return <p className="text-[12px] text-mid">Prettifying…</p>;
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
  // Per-item tag edits — keyed by QueueItem.id. Fall back to AI tags on save.
  const [editedTags, setEditedTags] = useState<Record<string, ItemTags>>({});
  const [error, setError] = useState<string | null>(null);

  const current = items[index];
  const isLast = index >= items.length - 1;

  function tagsFor(it: QueueItem): ItemTags {
    return editedTags[it.id] ?? it.payload!.tags;
  }

  function updateCurrentTags(patch: Partial<ItemTags>) {
    if (!current) return;
    setEditedTags((prev) => ({
      ...prev,
      [current.id]: { ...tagsFor(current), ...patch },
    }));
  }

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
          const t = tagsFor(it);
          return {
            id: p.itemId,
            user_id: user.id,
            original_image_url: p.originalImageUrl,
            cutout_image_url: p.cutoutImageUrl,
            thumb_image_url: p.thumbImageUrl,
            category: t.category,
            subcategory: t.subcategory,
            primary_color_hex: t.primary_color_hex,
            primary_color_name: t.primary_color_name,
            secondary_colors: t.secondary_colors,
            material: t.material,
            pattern: t.pattern,
            season: t.season,
            formality: t.formality,
            palette_fit_tags: t.palette_fit_tags,
            ai_description: t.ai_description,
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

  const tags = tagsFor(current);
  const keepCount = keepIds.size;

  return (
    <>
      <div className="px-5 py-3 flex items-center justify-between border-b border-hairline">
        <span className="text-[12px] text-mid font-mono tabular-nums">
          {index + 1} / {items.length}
        </span>
        <span className="text-[12px] text-mid">{keepCount} keeping</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative w-full bg-[#F0EDE3] flex items-center justify-center border-b border-hairline"
          style={{ height: 220 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.payload.cutoutImageUrl}
            alt=""
            className="max-w-[160px] max-h-[200px] object-contain"
          />
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <ReviewField label="Category">
            <select
              value={tags.category}
              onChange={(e) => updateCurrentTags({ category: e.target.value as ItemCategory })}
              className="w-full bg-transparent text-[14px] text-charcoal capitalize outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </ReviewField>

          <ReviewField label="Subcategory">
            <input
              value={tags.subcategory}
              onChange={(e) => updateCurrentTags({ subcategory: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
              placeholder="e.g. blouse"
            />
          </ReviewField>

          <ReviewField label="Colour">
            <div className="flex items-center gap-2.5">
              <span
                className="w-[20px] h-[20px] rounded-full shrink-0"
                style={{
                  background: tags.primary_color_hex,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              />
              <input
                value={tags.primary_color_name}
                onChange={(e) => updateCurrentTags({ primary_color_name: e.target.value })}
                className="flex-1 bg-transparent text-[14px] text-charcoal outline-none"
              />
            </div>
          </ReviewField>

          <ReviewField label="Material">
            <input
              value={tags.material}
              onChange={(e) => updateCurrentTags({ material: e.target.value })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
            />
          </ReviewField>

          <ReviewField label="Seasons">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {SEASONS.map((s) => {
                const active = tags.season?.includes(s.value) ?? false;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      const set = new Set(tags.season ?? []);
                      if (set.has(s.value)) set.delete(s.value);
                      else set.add(s.value);
                      updateCurrentTags({ season: Array.from(set) });
                    }}
                    className={clsx(
                      "inline-flex items-center h-8 px-3 rounded-full border text-[13px] leading-none transition-colors",
                      active
                        ? "bg-charcoal text-surface border-charcoal font-medium"
                        : "bg-transparent text-charcoal border-border-strong"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </ReviewField>

          <ReviewField label="Formality">
            <select
              value={tags.formality}
              onChange={(e) => updateCurrentTags({ formality: e.target.value as ItemFormality })}
              className="w-full bg-transparent text-[14px] text-charcoal outline-none"
            >
              {FORMALITIES.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </ReviewField>

          <div className="p-3.5 bg-surface-alt border border-hairline rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name="auto_awesome" size={12} className="text-accent" />
              <span className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Description
              </span>
            </div>
            <textarea
              value={tags.ai_description}
              onChange={(e) => updateCurrentTags({ ai_description: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-[13px] leading-[1.55] text-charcoal outline-none resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-danger pt-1">{error}</p>}
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

function ReviewField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3.5 bg-surface border border-hairline rounded-lg">
      <span className="block text-[10px] font-semibold tracking-[1.2px] uppercase text-mid mb-1.5">
        {label}
      </span>
      {children}
    </div>
  );
}
