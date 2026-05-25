import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light palette
        canvas:        "#FAFAF7",
        surface:       "#FFFFFF",
        "surface-alt": "#F4F2EC",
        charcoal:      "#1F1F1D",
        mid:           "#6B6B68",
        subtle:        "#A8A6A1",
        faint:         "#C9C6BF",
        hairline:      "#E8E6E1",
        "border-strong":"#D8D5CE",
        accent:        "#8B7355",
        "accent-soft": "#EFE9DF",
        danger:        "#9A4A3A",
        heart:         "#B85A52",
        // Dark palette
        "dark-bg":         "#16140F",
        "dark-surface":    "#1F1C16",
        "dark-surface-alt":"#27231C",
        "dark-text":       "#F2EFE8",
        "dark-mid":        "#8E8A80",
        "dark-subtle":     "#5F5C54",
        "dark-hairline":   "#2C2820",
        "dark-border-strong":"#3A352B",
        "dark-accent":     "#B49274",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
