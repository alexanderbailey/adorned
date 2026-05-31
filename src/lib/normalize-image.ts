"use client";

// Claude vision accepts jpeg, png, gif, webp. iPhone Photos can hand us
// HEIC or AVIF — bg-removal silently passes those through, then Claude
// rejects on content-sniff. Normalize anything non-standard to JPEG.

const CLAUDE_SAFE = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function normalizeImage(file: File): Promise<File> {
  if (CLAUDE_SAFE.has(file.type)) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image conversion produced empty blob"));
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], newName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
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
