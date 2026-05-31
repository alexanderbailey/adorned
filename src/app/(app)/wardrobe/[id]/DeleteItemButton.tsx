"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

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
        <Icon name="check" size={18} />
      ) : (
        <Icon name="delete" size={18} />
      )}
    </button>
  );
}
