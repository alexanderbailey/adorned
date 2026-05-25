"use client";

// Lazy-load @imgly/background-removal only in the browser
// The WASM model (~25MB) is downloaded on first use and cached by the browser.

export type BgRemovalProgress = {
  key: string;
  type: "loading" | "compute";
  current: number;
  total: number;
};

export async function removeBackground(
  file: File,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<Blob> {
  const { removeBackground: imglyRemove } = await import(
    "@imgly/background-removal"
  );

  const blob = await imglyRemove(file, {
    progress: onProgress
      ? (key, current, total) => onProgress({ key, type: key.startsWith("compute") ? "compute" : "loading", current, total })
      : undefined,
    output: {
      format: "image/webp",
      quality: 0.9,
    },
  });

  return blob;
}

export function generateThumb(cutoutBlob: Blob, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(cutoutBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("thumb failed"))),
        "image/webp",
        0.8
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
