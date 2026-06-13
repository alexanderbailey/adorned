"use client";

import { useCallback, useEffect, useState } from "react";
import type { EntitlementsSnapshot } from "./state";

// Client-side entitlements fetcher. Returns the snapshot + a refresh function.
// Components should refresh after any action that mutates billing state
// (subscribe, topup, generate, prettify, visualize).
export function useEntitlements() {
  const [data, setData] = useState<EntitlementsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/me", { cache: "no-store" });
      if (res.ok) {
        setData((await res.json()) as EntitlementsSnapshot);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
