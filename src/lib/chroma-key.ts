import "server-only";
import sharp from "sharp";

// Removes a solid (near-)white background and replaces it with real alpha.
// Uses BFS flood-fill from the four corners, so white pixels INSIDE the
// garment (a white collar, button, label, etc.) are preserved while the
// surrounding background goes transparent.
//
// Tolerance: a pixel is considered "white" if R, G, and B are all within
// `tolerance` of 255. 18 is forgiving enough for Gemini's mild yellowing
// without eating into garment edges.

export interface ChromaKeyOptions {
  /** Per-channel tolerance from 255. Default 18. */
  tolerance?: number;
  /** Feather: pixels with channels in [255-feather, 255-tolerance] get partial alpha. */
  feather?: number;
}

export async function keyWhiteBackground(
  input: Buffer,
  opts: ChromaKeyOptions = {}
): Promise<Buffer> {
  const tolerance = opts.tolerance ?? 18;
  const feather = opts.feather ?? 30;

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const channels = info.channels as 4;
  const buf = Buffer.from(data); // mutable copy

  const totalPx = width * height;
  const visited = new Uint8Array(totalPx);

  const isWhiteish = (idx: number): boolean => {
    const off = idx * channels;
    return (
      buf[off] >= 255 - tolerance &&
      buf[off + 1] >= 255 - tolerance &&
      buf[off + 2] >= 255 - tolerance
    );
  };

  // Seed the BFS from any of the four corners that look white.
  const queue: number[] = [];
  let head = 0;
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [cx, cy] of corners) {
    const idx = cy * width + cx;
    if (!visited[idx] && isWhiteish(idx)) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  // BFS flood-fill — mark every white-ish pixel reachable from the corners.
  // We don't write the alpha here; we just mark which pixels are background,
  // so the feather pass after can use the SAME mask without re-classifying.
  const isBackground = new Uint8Array(totalPx);
  while (head < queue.length) {
    const idx = queue[head++];
    isBackground[idx] = 1;
    const x = idx % width;
    const y = (idx - x) / width;

    if (x > 0) {
      const n = idx - 1;
      if (!visited[n] && isWhiteish(n)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
    if (x < width - 1) {
      const n = idx + 1;
      if (!visited[n] && isWhiteish(n)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
    if (y > 0) {
      const n = idx - width;
      if (!visited[n] && isWhiteish(n)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
    if (y < height - 1) {
      const n = idx + width;
      if (!visited[n] && isWhiteish(n)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  // Pass 2: write alpha. Background pixels become fully transparent.
  // Edge pixels (white-ish but not flood-filled, or partial whiteness next to
  // background) get a softened alpha so the cutout edge doesn't look jagged.
  for (let i = 0; i < totalPx; i++) {
    const off = i * channels;
    if (isBackground[i]) {
      buf[off + 3] = 0;
      continue;
    }
    // If a foreground pixel is sitting right next to a background pixel AND
    // it's only mildly white-ish (whiter than tolerance but not pure white),
    // feather it. We just sample the four neighbours.
    const x = i % width;
    const y = (i - x) / width;
    const r = buf[off];
    const g = buf[off + 1];
    const b = buf[off + 2];
    const minChannel = Math.min(r, g, b);
    // 255 - minChannel = "how far from white" — 0 means pure white.
    const distFromWhite = 255 - minChannel;
    if (distFromWhite >= tolerance + feather) continue; // fully opaque already.
    // Is any neighbour transparent? Then we're an edge pixel.
    let isEdge = false;
    if (x > 0 && isBackground[i - 1]) isEdge = true;
    else if (x < width - 1 && isBackground[i + 1]) isEdge = true;
    else if (y > 0 && isBackground[i - width]) isEdge = true;
    else if (y < height - 1 && isBackground[i + width]) isEdge = true;
    if (!isEdge) continue;
    // Map distFromWhite in [tolerance, tolerance+feather] linearly to alpha [0, 255].
    const t = (distFromWhite - tolerance) / feather;
    const alpha = Math.max(0, Math.min(255, Math.round(t * 255)));
    buf[off + 3] = alpha;
  }

  return sharp(buf, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
