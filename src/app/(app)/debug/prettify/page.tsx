"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { normalizeImage } from "@/lib/normalize-image";

// The current production prompt — preloaded into the textarea so you can
// fork it and iterate. Edit freely; persisted to localStorage on every change.
const DEFAULT_PROMPT = [
  "Task: produce a clean product photograph of the clothing item shown in the image.",
  "",
  "REQUIRED:",
  "- Solid PURE WHITE (#FFFFFF) background. Do NOT render a transparent or checkerboard background.",
  "- Item facing forward, centred in the frame, oriented upright as it would be worn.",
  "- Smooth out visible creases and wrinkles so the garment lies flat as in a product shot.",
  "- No shadow behind or beneath the item.",
  "",
  "MUST PRESERVE EXACTLY:",
  "- The exact colour and colour saturation. Do not brighten, recolour, or correct a colour cast.",
  "- The exact pattern, print, embroidery, beading, or surface detail.",
  "- The exact material/fabric and its surface texture.",
  "- The silhouette and proportions of the garment.",
  "- All design details: neckline, sleeve length and shape, collar, buttons, zippers, pockets, hem, slits, belt loops, etc.",
  "",
  "MUST NOT:",
  "- Add or remove decorative elements that are not in the source image.",
  "- Change the cut, length, or fit.",
  "- Output a different garment or stylise into an illustration.",
  "- Output text, labels, watermarks, mannequins, or hangers.",
  "",
  "Output: a single image, pure white background, clothing item only.",
].join("\n");

const STORAGE_KEY = "adorned:debug:prettify";

interface Result {
  image: string;
  mimeType: string;
  bytes: number;
  text: string | null;
  model: string;
  elapsedMs: number;
}

type Model = "standard" | "advanced";

export default function DebugPrettifyPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [temperature, setTemperature] = useState(1);
  const [busy, setBusy] = useState<Model | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Persist prompt + temperature across reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { prompt?: string; temperature?: number };
        if (saved.prompt) setPrompt(saved.prompt);
        if (typeof saved.temperature === "number") setTemperature(saved.temperature);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prompt, temperature })
      );
    } catch {}
  }, [prompt, temperature]);

  useEffect(() => {
    return () => {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    };
  }, [sourcePreview]);

  async function handlePick(file: File) {
    setError(null);
    setResult(null);
    try {
      const { file: normalized } = await normalizeImage(file);
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
      setSourcePreview(URL.createObjectURL(normalized));
      setSourceFile(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image");
    }
  }

  async function run(model: Model) {
    if (!sourceFile) {
      setError("Pick an image first.");
      return;
    }
    setBusy(model);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", sourceFile);
      form.append("prompt", prompt);
      form.append("model", model);
      form.append("temperature", String(temperature));
      const res = await fetch("/api/debug/prettify", {
        method: "POST",
        body: form,
      });
      const body = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
      } else {
        setResult(body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  function resetPrompt() {
    setPrompt(DEFAULT_PROMPT);
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex items-center justify-between px-4 pt-[54px] h-[88px] border-b border-hairline">
        <Link
          href="/wardrobe"
          className="w-10 h-10 flex items-center justify-center text-charcoal"
        >
          <Icon name="close" size={22} />
        </Link>
        <span className="text-[15px] font-semibold tracking-[-0.2px]">
          Prettify playground
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 pb-40">
        {/* Source picker */}
        <section className="space-y-2">
          <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
            Source image
          </p>
          {sourcePreview ? (
            <div className="space-y-2">
              <div
                className="w-full aspect-[3/4] max-w-[300px] bg-surface-alt rounded border border-hairline overflow-hidden mx-auto"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourcePreview}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="block mx-auto text-[13px] text-mid underline underline-offset-2"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-12 border border-border-strong text-charcoal text-[15px] font-medium rounded-[6px]"
            >
              Choose image
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePick(f);
              e.target.value = "";
            }}
          />
        </section>

        {/* Prompt */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Prompt
            </p>
            <button
              onClick={resetPrompt}
              className="text-[12px] text-mid underline underline-offset-2"
            >
              Reset to default
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={14}
            className="w-full p-3 text-[12px] leading-[1.5] font-mono text-charcoal bg-surface border border-hairline rounded-lg outline-none focus:border-charcoal resize-y"
          />
        </section>

        {/* Knobs */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
              Temperature
            </p>
            <span className="text-[12px] text-mid font-mono tabular-nums">
              {temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-[11px] text-mid">
            Higher = more variation. Image models often ignore this; default is 1.
          </p>
        </section>

        {/* Result */}
        {result && (
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
                Result · {result.model}
              </p>
              <span className="text-[11px] text-mid font-mono tabular-nums">
                {(result.elapsedMs / 1000).toFixed(1)}s ·{" "}
                {(result.bytes / 1024).toFixed(0)}KB
              </span>
            </div>
            <button
              onClick={() => setZoomOpen(true)}
              className="block w-full"
              aria-label="Open full screen"
            >
              <div
                className="w-full aspect-[3/4] max-w-[300px] rounded border border-hairline overflow-hidden mx-auto"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.image}
                  alt="Result"
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
            <p className="text-[11px] text-mid text-center">
              Tap result to zoom · checkerboard behind = real alpha; checker on image = baked-in pixels
            </p>
            <div className="flex gap-2">
              <a
                href={result.image}
                download="prettify-result.png"
                className="flex-1 h-10 border border-border-strong text-charcoal text-[13px] font-medium rounded-[6px] flex items-center justify-center"
              >
                Download
              </a>
            </div>
            {result.text && (
              <details className="text-[12px]">
                <summary className="text-mid cursor-pointer">Model text output</summary>
                <pre className="mt-1 p-2 bg-surface border border-hairline rounded whitespace-pre-wrap text-charcoal">
                  {result.text}
                </pre>
              </details>
            )}
          </section>
        )}

        {error && (
          <section className="p-3 bg-surface border border-hairline rounded-lg">
            <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-danger mb-1">
              Error
            </p>
            <p className="text-[13px] text-charcoal break-words">{error}</p>
          </section>
        )}
      </div>

      {/* Generate buttons */}
      <div className="px-5 py-4 border-t border-hairline pb-safe grid grid-cols-2 gap-2">
        <button
          onClick={() => run("standard")}
          disabled={!sourceFile || busy !== null}
          className="h-14 px-3 border border-border-strong text-charcoal rounded-[6px] flex flex-col items-center justify-center disabled:opacity-40"
        >
          <span className="text-[13px] font-medium">
            {busy === "standard" ? "Running…" : "Standard"}
          </span>
          <span className="text-[10px] text-mid uppercase tracking-[0.4px]">
            gemini-2.5-flash-image
          </span>
        </button>
        <button
          onClick={() => run("advanced")}
          disabled={!sourceFile || busy !== null}
          className="h-14 px-3 bg-charcoal text-surface rounded-[6px] flex flex-col items-center justify-center disabled:opacity-40"
        >
          <span className="text-[13px] font-medium">
            {busy === "advanced" ? "Running…" : "Advanced"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.4px] opacity-80">
            gemini-3-pro-image
          </span>
        </button>
      </div>

      {/* Zoom modal */}
      {zoomOpen && result && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="w-full h-full overflow-auto"
            style={{
              touchAction: "pinch-zoom",
              WebkitOverflowScrolling: "touch",
              backgroundImage:
                "linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.image}
              alt="Result zoomed"
              className="block min-w-full min-h-full"
              style={{ touchAction: "pinch-zoom" }}
            />
          </div>
          <button
            onClick={() => setZoomOpen(false)}
            className="fixed top-[54px] right-4 w-10 h-10 flex items-center justify-center bg-canvas rounded-full"
            aria-label="Close zoom"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
