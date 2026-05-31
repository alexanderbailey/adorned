"use client";

import { clsx } from "clsx";

interface IconProps {
  /** Material Symbols name (snake_case) — e.g. "checkroom", "favorite". */
  name: string;
  /** Pixel size; default 22. */
  size?: number;
  /** Use the filled variant (FILL axis = 1). */
  filled?: boolean;
  /** Optical-size axis (default 24). */
  opsz?: number;
  /** Weight axis (default 400). */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  className?: string;
  "aria-hidden"?: boolean;
}

// Single-letter glyph names use the Material Symbols Outlined font loaded in
// the root layout. The fill / weight / optical-size axes are controlled via
// font-variation-settings.
export function Icon({
  name,
  size = 22,
  filled = false,
  opsz = 24,
  weight = 400,
  className,
  ...rest
}: IconProps) {
  return (
    <span
      className={clsx("material-symbols-outlined select-none leading-none", className)}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${opsz}`,
      }}
      aria-hidden={rest["aria-hidden"] ?? true}
    >
      {name}
    </span>
  );
}
