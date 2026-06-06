// Client-side helper that calls /api/items/prettify with one auto-retry on
// transient (5xx / network) failures. 4xx errors fail fast (auth, content,
// validation — retry won't fix).

import { extractErrorMessage } from "@/lib/error";

export async function prettifyViaApi(
  itemId: string,
  sourceImageUrl: string,
  instructions?: string
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/items/prettify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_image_url: sourceImageUrl,
          item_id: itemId,
          instructions,
        }),
      });
      if (res.ok) {
        const { cutout_url } = (await res.json()) as { cutout_url: string };
        return cutout_url;
      }
      const detail = extractErrorMessage(await res.text()) || `HTTP ${res.status}`;
      // 4xx: fail fast, don't retry.
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Prettify failed: ${detail.slice(0, 200)}`);
      }
      // 5xx: record + retry once.
      lastError = new Error(`Prettify failed (${res.status}): ${detail.slice(0, 200)}`);
    } catch (err) {
      // Network errors land here too — retry them.
      if (err instanceof TypeError) {
        lastError = new Error("Network error contacting prettify endpoint");
      } else if (attempt === 1) {
        throw err;
      } else {
        lastError = err instanceof Error ? err : new Error("Prettify failed");
      }
    }
  }
  throw lastError ?? new Error("Prettify failed");
}
