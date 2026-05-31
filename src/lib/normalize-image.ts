"use client";

// Claude vision accepts jpeg, png, gif, webp. iPhone Photos can hand us
// HEIC or AVIF — bg-removal silently passes those through, then Claude
// rejects on content-sniff.
//
// We also detect alpha channels so we can:
//   1) preserve transparency (PNG instead of JPEG — otherwise transparent
//      pixels collapse to black and bg-removal eats the edges), and
//   2) tell callers when the input is already a cutout, so they can skip
//      bg-removal entirely.

const CLAUDE_SAFE = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const ALPHA_CAPABLE = new Set(["image/png", "image/webp", "image/avif", "image/gif"]);

export interface NormalizedImage {
  file: File;
  hasAlpha: boolean;
  /** All four corners transparent — input looks like an already-extracted cutout. */
  looksLikeCutout: boolean;
}

export async function normalizeImage(file: File): Promise<NormalizedImage> {
  // Fast path: a JPEG can't have alpha, so it's never a cutout. Skip decode.
  if (file.type === "image/jpeg") {
    return { file, hasAlpha: false, looksLikeCutout: false };
  }

  // For other formats we need to decode anyway (to check alpha and/or to
  // convert away from HEIC/AVIF).
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Check alpha by sampling: corners + a coarse interior scan.
      // Only formats that can carry alpha get checked; JPEGs early-returned.
      let hasAlpha = false;
      let corners = 0;
      if (ALPHA_CAPABLE.has(file.type)) {
        const corner = (x: number, y: number) =>
          ctx.getImageData(x, y, 1, 1).data[3] === 0;
        const c0 = corner(0, 0);
        const c1 = corner(w - 1, 0);
        const c2 = corner(0, h - 1);
        const c3 = corner(w - 1, h - 1);
        corners = (c0 ? 1 : 0) + (c1 ? 1 : 0) + (c2 ? 1 : 0) + (c3 ? 1 : 0);
        if (corners > 0) {
          hasAlpha = true;
        } else {
          // No corner transparency — sample a coarse 10×10 grid to catch
          // partial-alpha images (e.g. shadows or feathered edges).
          const step = 10;
          const stepX = Math.max(1, Math.floor(w / step));
          const stepY = Math.max(1, Math.floor(h / step));
          outer: for (let y = 0; y < h; y += stepY) {
            for (let x = 0; x < w; x += stepX) {
              if (ctx.getImageData(x, y, 1, 1).data[3] < 255) {
                hasAlpha = true;
                break outer;
              }
            }
          }
        }
      }
      const looksLikeCutout = corners >= 3;

      // Output format: keep alpha if present, otherwise JPEG (smaller).
      const outFormat = hasAlpha ? "image/png" : "image/jpeg";
      const outExt = hasAlpha ? "png" : "jpg";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image conversion produced empty blob"));
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, `.${outExt}`);
          const out = new File([blob], newName, { type: outFormat });
          resolve({ file: out, hasAlpha, looksLikeCutout });
        },
        outFormat,
        outFormat === "image/jpeg" ? 0.92 : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Your browser can't decode this image (${file.type || "unknown format"}). Try saving it as JPEG first.`
        )
      );
    };
    img.src = url;
  });

  // Note: previously this returned a File directly. If a caller still imports
  // it that way it'll break — both call sites updated in the same change.
}

// Back-compat helper for callers that just want the file (don't care about
// the alpha/cutout signal). Unused so far but here in case it's useful.
export async function normalizeImageFile(file: File): Promise<File> {
  // Already Claude-safe AND no special handling needed → fast path.
  if (CLAUDE_SAFE.has(file.type) && file.type === "image/jpeg") return file;
  const { file: out } = await normalizeImage(file);
  return out;
}
