"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("items").update({ archived: true }).eq("id", itemId);
    router.push("/wardrobe");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`w-10 h-10 flex items-center justify-center transition-colors ${
        confirming ? "text-danger" : "text-mid"
      }`}
    >
      {deleting ? (
        <div className="w-4 h-4 border-2 border-hairline border-t-danger rounded-full animate-spin" />
      ) : confirming ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
        </svg>
      )}
    </button>
  );
}
