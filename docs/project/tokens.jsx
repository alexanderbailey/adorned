// Adorned — design tokens & shared chrome

const T = {
  // Light palette
  bg:        '#FAFAF7',
  surface:   '#FFFFFF',
  surfaceAlt:'#F4F2EC',
  text:      '#1F1F1D',
  muted:     '#6B6B68',
  subtle:    '#A8A6A1',
  faint:     '#C9C6BF',
  border:    '#E8E6E1',
  borderStrong: '#D8D5CE',
  accent:    '#8B7355',  // warm taupe
  accentInk: '#FFFFFF',
  accentSoft:'#EFE9DF',
  danger:    '#9A4A3A',
  heart:     '#B85A52',

  // Dark
  dBg:       '#16140F',
  dSurface:  '#1F1C16',
  dSurfaceAlt:'#27231C',
  dText:     '#F2EFE8',
  dMuted:    '#8E8A80',
  dSubtle:   '#5F5C54',
  dBorder:   '#2C2820',
  dBorderStrong:'#3A352B',
  dAccent:   '#B49274',

  // Type
  font: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// Inject Inter once
if (typeof document !== 'undefined' && !document.getElementById('adorned-font')) {
  const l = document.createElement('link');
  l.id = 'adorned-font';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(l);
  // Global resets for inside-iOS content
  const s = document.createElement('style');
  s.id = 'adorned-base';
  s.textContent = `
    .ad * { box-sizing: border-box; }
    .ad { font-family: ${T.font}; color: ${T.text}; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
    .ad button { font-family: inherit; cursor: pointer; }
    .ad .scroll { overflow-y: auto; }
    .ad .scroll::-webkit-scrollbar { display: none; }
    .ad .row { display: flex; align-items: center; }
    .ad .col { display: flex; flex-direction: column; }
    .ad .hairline { background: ${T.border}; height: 1px; }
    .ad .v-hairline { background: ${T.border}; width: 1px; }
    .ad-shimmer {
      background: linear-gradient(90deg, ${T.surfaceAlt} 0%, ${T.bg} 50%, ${T.surfaceAlt} 100%);
      background-size: 200% 100%;
      animation: adShimmer 1.6s ease-in-out infinite;
    }
    @keyframes adShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
// Generic UI atoms
// ─────────────────────────────────────────────────────────────

function Chip({ children, active, dark, onClick, style }) {
  const palette = dark ? {
    bg: active ? T.dText : 'transparent',
    text: active ? T.dBg : T.dText,
    border: active ? T.dText : T.dBorderStrong,
  } : {
    bg: active ? T.text : 'transparent',
    text: active ? '#FFF' : T.text,
    border: active ? T.text : T.borderStrong,
  };
  return (
    <button onClick={onClick} style={{
      height: 32, padding: '0 14px',
      borderRadius: 999,
      border: `1px solid ${palette.border}`,
      background: palette.bg,
      color: palette.text,
      fontSize: 13, fontWeight: active ? 500 : 400,
      letterSpacing: -0.1,
      whiteSpace: 'nowrap', flexShrink: 0,
      ...style,
    }}>{children}</button>
  );
}

function MicroChip({ children, tone = 'default', dark, style }) {
  const tones = {
    default: { bg: dark ? T.dSurfaceAlt : T.surfaceAlt, text: dark ? T.dText : T.text },
    soft:    { bg: dark ? T.dBg : T.accentSoft, text: dark ? T.dAccent : T.accent },
    outline: { bg: 'transparent', text: dark ? T.dMuted : T.muted, border: `1px solid ${dark ? T.dBorder : T.border}` },
  };
  const c = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 26, padding: '0 10px',
      borderRadius: 999,
      background: c.bg, color: c.text, border: c.border || 'none',
      fontSize: 12, fontWeight: 500, letterSpacing: -0.05,
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
}

function Btn({ children, variant = 'primary', size = 'md', dark, onClick, style, leading, trailing, full }) {
  const sizes = {
    sm: { h: 36, px: 14, fs: 13 },
    md: { h: 48, px: 20, fs: 15 },
    lg: { h: 56, px: 24, fs: 16 },
  };
  const s = sizes[size];
  const palette = {
    primary: dark
      ? { bg: T.dText, text: T.dBg, border: 'none' }
      : { bg: T.text, text: '#FFF', border: 'none' },
    secondary: dark
      ? { bg: 'transparent', text: T.dText, border: `1px solid ${T.dBorderStrong}` }
      : { bg: 'transparent', text: T.text, border: `1px solid ${T.borderStrong}` },
    accent: { bg: T.accent, text: '#FFF', border: 'none' },
    ghost: { bg: 'transparent', text: dark ? T.dText : T.text, border: 'none' },
  }[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`,
      borderRadius: 6,
      background: palette.bg, color: palette.text, border: palette.border,
      fontSize: s.fs, fontWeight: 500, letterSpacing: -0.1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: full ? '100%' : undefined,
      ...style,
    }}>
      {leading}{children}{trailing}
    </button>
  );
}

function Swatch({ color, size = 24, ring, dark, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      border: 'none', background: 'transparent', padding: 0,
    }}>
      <span style={{
        width: size, height: size, borderRadius: '50%',
        background: color,
        boxShadow: ring
          ? `0 0 0 1.5px ${dark ? T.dBg : T.bg}, 0 0 0 2.5px ${dark ? T.dText : T.text}`
          : `inset 0 0 0 1px ${color === '#FFFFFF' || color === '#FFF' ? T.border : 'rgba(0,0,0,0.06)'}`,
        display: 'block',
      }} />
      {label && <span style={{ fontSize: 10, color: dark ? T.dMuted : T.muted, letterSpacing: 0 }}>{label}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// PaintCircle — a hand-painted swatch, slightly irregular like
// a brush dab. Seeded for deterministic variation across re-renders.
// ─────────────────────────────────────────────────────────────
const PAINT_RADII = [
  '52% 48% 51% 49% / 49% 52% 48% 51%',
  '49% 51% 48% 52% / 52% 48% 51% 49%',
  '51% 49% 52% 48% / 48% 51% 49% 52%',
  '48% 52% 49% 51% / 51% 49% 52% 48%',
  '50% 50% 52% 48% / 48% 52% 50% 50%',
  '53% 47% 49% 51% / 51% 49% 53% 47%',
];
function PaintCircle({ color, size = 56, seed = 0, ring, dark, style }) {
  const i = Math.abs((seed * 31 + 7) % PAINT_RADII.length);
  const rotation = (seed * 73) % 360;
  const isWhite = /^#?(fff|ffffff|fafa|f6f|f8f)/i.test(color.replace('#',''));
  return (
    <span style={{
      width: size, height: size,
      borderRadius: PAINT_RADII[i],
      background: color,
      display: 'inline-block',
      transform: `rotate(${rotation}deg)`,
      // Watercolor-ish edge: faint hairline + soft inner highlight + soft inner shadow
      boxShadow: [
        ring ? `0 0 0 1px ${dark ? T.dText : T.text}` : '',
        `inset 0 0 0 0.5px ${isWhite ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'}`,
        `inset -2px -3px 5px rgba(0,0,0,0.06)`,
        `inset 2px 2px 4px rgba(255,255,255,0.18)`,
      ].filter(Boolean).join(', '),
      flexShrink: 0,
      ...style,
    }}/>
  );
}

// PaintSwatch — circle + caption below, like the reference
function PaintSwatch({ color, name, size = 44, seed = 0, ring, dark, twoLine, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
      width: size + 12,
    }}>
      <PaintCircle color={color} size={size} seed={seed} ring={ring} dark={dark}/>
      {name && (
        <span style={{
          fontSize: 9.5, color: dark ? T.dMuted : T.muted,
          letterSpacing: 0, lineHeight: 1.15, textAlign: 'center',
          maxWidth: size + 14,
          whiteSpace: twoLine ? 'normal' : 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</span>
      )}
    </button>
  );
}

// Small icon set — Phosphor/Lucide style, regular weight
const Icon = {
  search: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  filter: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5h16M7 12h10M10 19h4"/></svg>,
  plus: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  close: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
  back: (p = {}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>,
  chevR: (p = {}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18l6-6-6-6"/></svg>,
  chevD: (p = {}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9l6 6 6-6"/></svg>,
  more:  (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>,
  heart: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20s-7-4.5-9.3-9C1 8 3 4.5 6.5 4.5c2 0 3.5 1 5.5 3.5 2-2.5 3.5-3.5 5.5-3.5 3.5 0 5.5 3.5 3.8 6.5C19 15.5 12 20 12 20z"/></svg>,
  heartFill: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 20s-7-4.5-9.3-9C1 8 3 4.5 6.5 4.5c2 0 3.5 1 5.5 3.5 2-2.5 3.5-3.5 5.5-3.5 3.5 0 5.5 3.5 3.8 6.5C19 15.5 12 20 12 20z"/></svg>,
  edit: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>,
  trash: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>,
  refresh: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4"/></svg>,
  camera: (p = {}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  image: (p = {}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-5 5 5 3-3 5 5"/></svg>,
  upload: (p = {}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>,
  sparkle: (p = {}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  calendar:(p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  // Tab icons - Phosphor-style line
  hanger:(p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 9V8a2 2 0 1 1 2 2"/><path d="M12 9L3 17a1 1 0 0 0 .7 1.7h16.6A1 1 0 0 0 21 17l-9-8z"/></svg>,
  layers:(p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></svg>,
  wand:(p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 21L15 9M14 6l4 4M17 3v3M21 7h-3M5 14v2M4 15h2M19 13v2M18 14h2"/></svg>,
  user:(p={}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  arrowR:(p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check:(p={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l5 5L20 7"/></svg>,
  drag:(p={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>,
  flash:(p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
  flip:(p={}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 9-9v3M21 12a9 9 0 0 1-9 9v-3M16 6l-4-3M8 18l4 3"/></svg>,
  sun:(p={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>,
};

Object.assign(window, { T, Chip, MicroChip, Btn, Swatch, PaintCircle, PaintSwatch, Icon });
