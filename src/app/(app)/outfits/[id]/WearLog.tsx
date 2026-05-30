"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export interface WearLogEntry {
  id: string;
  worn_on: string; // YYYY-MM-DD
}

function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function WearLog({
  outfitId,
  initialEntries,
}: {
  outfitId: string;
  initialEntries: WearLogEntry[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [entries, setEntries] = useState(initialEntries);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }
    const { data, error: insertErr } = await supabase
      .from("wear_log")
      .insert({ outfit_id: outfitId, user_id: user.id, worn_on: date })
      .select("id, worn_on")
      .single();
    if (insertErr || !data) {
      setError(insertErr?.message ?? "Failed to log");
      setSaving(false);
      return;
    }
    setEntries((prev) =>
      [...prev, { id: data.id, worn_on: data.worn_on }].sort(
        (a, b) => b.worn_on.localeCompare(a.worn_on)
      )
    );
    setPickerOpen(false);
    setSaving(false);
    setDate(todayIso());
    toast.show("Logged as worn", "success");
    router.refresh();
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          Wear log
        </p>
        <button
          onClick={() => setPickerOpen(true)}
          className="text-[12px] text-charcoal underline underline-offset-2"
        >
          + Mark as worn
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-[13px] text-mid">Never worn yet.</p>
      ) : (
        <p className="text-[13px] text-charcoal">
          Worn {entries.length} time{entries.length === 1 ? "" : "s"}:{" "}
          <span className="text-mid">
            {entries
              .slice(0, 6)
              .map((e) =>
                new Date(e.worn_on + "T00:00:00").toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })
              )
              .join(" · ")}
            {entries.length > 6 && ` · +${entries.length - 6} more`}
          </span>
        </p>
      )}

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-charcoal/30"
          onClick={() => !saving && setPickerOpen(false)}
        >
          <div
            className="w-full bg-canvas rounded-t-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 border-b border-hairline flex items-center justify-between">
              <button
                onClick={() => setPickerOpen(false)}
                disabled={saving}
                className="text-[13px] text-mid"
              >
                Cancel
              </button>
              <span className="text-[15px] font-semibold tracking-[-0.2px]">
                Mark as worn
              </span>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="text-[13px] text-charcoal font-medium disabled:opacity-40"
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
            <div className="px-5 py-5 space-y-3">
              <label className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Date worn
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayIso()}
                className="w-full p-3 text-[15px] text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal"
              />
              {error && <p className="text-[13px] text-danger">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
