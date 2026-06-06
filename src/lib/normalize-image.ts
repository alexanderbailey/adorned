"use client";

// iPhone Photos can hand us HEIC or AVIF, and phone snaps are 12+ MP which
// blow past Vercel's function body limit. This module:
//   1) decodes the input to canvas (browser handles HEIC/AVIF where supported),
//   2) downsizes to a max long-edge of MAX_DIMENSION,
//   3) re-encodes as JPEG (or PNG if the source has alpha — we don't want to
//      flatten a transparent cutout to a black background).

const ALPHA_CAPABLE = new Set(["image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_DIMENSION = 1920;

export interface NormalizedImage {
  file: File;
  hasAlpha: boolean;
}

export async function normalizeImage(file: File): Promise<NormalizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH));
      const w = Math.round(srcW * scale);
      const h = Math.round(srcH * scale);

      // First draw at full size to a probe canvas so we can sample alpha cheaply.
      // For huge JPEGs we skip the probe (no alpha possible) and go straight to
      // the resized canvas.
      let hasAlpha = false;
      if (ALPHA_CAPABLE.has(file.type)) {
        const probe = document.createElement("canvas");
        probe.width = srcW;
        probe.height = srcH;
        const pctx = probe.getContext("2d");
        if (pctx) {
          pctx.drawImage(img, 0, 0);
          // Sample a coarse grid — fast enough at original size, catches both
          // corner-transparent cutouts and partial-alpha (feathered) edges.
          const step = 12;
          const stepX = Math.max(1, Math.floor(srcW / step));
          const stepY = Math.max(1, Math.floor(srcH / step));
          outer: for (let y = 0; y < srcH; y += stepY) {
            for (let x = 0; x < srcW; x += stepX) {
              if (pctx.getImageData(x, y, 1, 1).data[3] < 255) {
                hasAlpha = true;
                break outer;
              }
            }
          }
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

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
          resolve({ file: out, hasAlpha });
        },
        outFormat,
        outFormat === "image/jpeg" ? 0.9 : undefined
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
}
