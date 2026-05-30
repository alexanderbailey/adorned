"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export function OutfitActions({
  outfitId,
  initialFavorited,
}: {
  outfitId: string;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function toggleFavorite() {
    const next = !favorited;
    setFavorited(next);
    const supabase = createClient();
    const { error } = await supabase
      .from("outfits")
      .update({ favorited: next })
      .eq("id", outfitId);
    if (error) {
      setFavorited(!next);
      toast.show(error.message, "error");
    } else {
      toast.show(next ? "Added to favourites" : "Removed from favourites", "success");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this outfit? Items in your wardrobe are not affected.")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("outfits").delete().eq("id", outfitId);
    if (error) {
      toast.show(`Delete failed: ${error.message}`, "error");
      setBusy(false);
      return;
    }
    toast.show("Outfit deleted", "success");
    router.push("/outfits");
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={toggleFavorite}
        className="w-9 h-9 flex items-center justify-center text-charcoal"
        aria-label={favorited ? "Unfavourite" : "Favourite"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={favorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center text-charcoal"
        aria-label="More"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-9 z-50 bg-canvas border border-hairline rounded-lg shadow-md min-w-[160px] overflow-hidden">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="block w-full text-left px-3 py-2.5 text-[13px] text-danger hover:bg-surface-alt disabled:opacity-40"
            >
              Delete outfit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
