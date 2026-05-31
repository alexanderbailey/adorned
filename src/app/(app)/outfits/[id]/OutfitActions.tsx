"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

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
        <Icon name="favorite" filled={favorited} size={20} />
      </button>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center text-charcoal"
        aria-label="More"
      >
        <Icon name="more_horiz" size={20} />
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
