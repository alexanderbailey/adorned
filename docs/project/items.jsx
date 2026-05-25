// Adorned — stylized SVG clothing illustrations
// Each garment renders as a flat cutout in a single color (or two-tone).
// Sized to fit a 100x140 viewport by default; scales with container.

// Color presets — muted, editorial
const C = {
  cream:    '#EFE7D8',
  ivory:    '#E8E3D5',
  beige:    '#D4C4A8',
  oat:      '#C9BB9C',
  camel:    '#B89970',
  toast:    '#9B7A53',
  espresso: '#3F2F22',
  charcoal: '#2C2A26',
  slate:    '#5C5E5F',
  fog:      '#9FA3A1',
  sage:     '#9CA889',
  moss:     '#6F7A5D',
  forest:   '#42513E',
  navy:     '#2E3849',
  denim:    '#6A7A91',
  wash:     '#A5B3C5',
  sky:      '#BFC9D4',
  rust:     '#A45A3E',
  brick:    '#7C3F32',
  blush:    '#D9B7AB',
  rose:     '#C28A85',
  plum:     '#5E4456',
  black:    '#1A1815',
  white:    '#F6F4EE',
  grey:     '#B5B2AB',
  butter:   '#E8D67C',
  honey:    '#C49A4F',
};

// ─────────── Garment SVGs ───────────
// Designed to fit in 100x140 box. Use viewBox=0 0 100 140.

const G = {
  tee: (c1, c2) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M30 22 L42 20 Q50 26 58 20 L70 22 L88 32 L82 48 L72 44 L72 110 Q72 116 66 116 L34 116 Q28 116 28 110 L28 44 L18 48 L12 32 Z" fill={c1}/>
      <path d="M42 20 Q50 28 58 20" fill="none" stroke={c2 || 'rgba(0,0,0,0.12)'} strokeWidth="1.2"/>
    </svg>
  ),
  longTee: (c1, c2) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M28 22 L42 20 Q50 26 58 20 L72 22 L90 34 L82 58 L74 54 L74 122 Q74 128 68 128 L32 128 Q26 128 26 122 L26 54 L18 58 L10 34 Z" fill={c1}/>
      <path d="M42 20 Q50 28 58 20" fill="none" stroke={c2 || 'rgba(0,0,0,0.12)'} strokeWidth="1.2"/>
    </svg>
  ),
  knit: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M22 28 L40 18 Q50 24 60 18 L78 28 L94 44 L84 64 L74 58 L76 118 Q76 124 70 124 L30 124 Q24 124 24 118 L26 58 L16 64 L6 44 Z" fill={c1}/>
      <path d="M40 18 Q50 28 60 18 L60 32 Q50 38 40 32 Z" fill="rgba(0,0,0,0.06)"/>
      {/* texture lines */}
      {[40,52,64,76,88,100,112].map(y => (
        <path key={y} d={`M30 ${y} Q50 ${y+2} 70 ${y}`} stroke="rgba(0,0,0,0.07)" strokeWidth="0.6" fill="none"/>
      ))}
    </svg>
  ),
  blouse: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M30 22 L44 20 L48 30 L52 30 L56 20 L70 22 L88 34 L82 52 L72 48 L74 116 Q74 122 68 122 L32 122 Q26 122 26 116 L28 48 L18 52 L12 34 Z" fill={c1}/>
      <line x1="50" y1="34" x2="50" y2="116" stroke="rgba(0,0,0,0.08)" strokeWidth="0.8"/>
      {[44,60,76,92,108].map(y => <circle key={y} cx="50" cy={y} r="0.9" fill="rgba(0,0,0,0.25)"/>)}
    </svg>
  ),
  buttonUp: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M28 22 L44 18 L46 26 Q50 30 54 26 L56 18 L72 22 L90 32 L84 50 L74 46 L74 120 Q74 126 68 126 L32 126 Q26 126 26 120 L26 46 L16 50 L10 32 Z" fill={c1}/>
      <path d="M44 18 L46 26 Q50 30 54 26 L56 18 L54 28 L46 28 Z" fill="rgba(0,0,0,0.1)"/>
      <line x1="50" y1="30" x2="50" y2="120" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8"/>
      {[46,62,78,94,110].map(y => <circle key={y} cx="50" cy={y} r="0.9" fill="rgba(0,0,0,0.3)"/>)}
    </svg>
  ),
  trousers: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M28 10 L72 10 L74 22 L70 130 L54 130 L50 50 L46 130 L30 130 L26 22 Z" fill={c1}/>
      <path d="M28 10 L72 10 L74 22 L26 22 Z" fill="rgba(0,0,0,0.07)"/>
      <line x1="50" y1="22" x2="50" y2="48" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6"/>
    </svg>
  ),
  jeans: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M26 8 L74 8 L76 22 L72 132 L54 132 L50 56 L46 132 L28 132 L24 22 Z" fill={c1}/>
      <path d="M26 8 L74 8 L76 22 L24 22 Z" fill="rgba(0,0,0,0.1)"/>
      <line x1="50" y1="22" x2="50" y2="54" stroke="rgba(0,0,0,0.1)" strokeWidth="0.6"/>
      {/* pockets */}
      <path d="M30 24 Q34 32 42 30" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6"/>
      <path d="M70 24 Q66 32 58 30" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6"/>
    </svg>
  ),
  shorts: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M28 30 L72 30 L74 42 L68 90 L54 90 L50 62 L46 90 L32 90 L26 42 Z" fill={c1}/>
      <path d="M28 30 L72 30 L74 42 L26 42 Z" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),
  skirt: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M34 22 L66 22 L70 36 L86 120 Q50 130 14 120 L30 36 Z" fill={c1}/>
      <path d="M34 22 L66 22 L70 36 L30 36 Z" fill="rgba(0,0,0,0.08)"/>
      {/* pleats */}
      {[38,46,54,62,70].map(x => (
        <line key={x} x1={x} y1="36" x2={x + (x-50)*0.7} y2="118" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"/>
      ))}
    </svg>
  ),
  miniSkirt: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M34 30 L66 30 L70 42 L78 88 Q50 94 22 88 L30 42 Z" fill={c1}/>
      <path d="M34 30 L66 30 L70 42 L30 42 Z" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),
  dress: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M36 14 L46 14 Q50 20 54 14 L64 14 L74 30 L70 46 L72 60 L88 128 Q50 138 12 128 L28 60 L30 46 L26 30 Z" fill={c1}/>
      <path d="M46 14 Q50 22 54 14" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1"/>
      <ellipse cx="50" cy="58" rx="22" ry="2" fill="rgba(0,0,0,0.07)"/>
    </svg>
  ),
  slipDress: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M38 14 Q42 22 36 30 L30 38 L26 56 L20 128 Q50 134 80 128 L74 56 L70 38 L64 30 Q58 22 62 14" fill={c1}/>
      <path d="M38 14 L42 26 L58 26 L62 14" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8"/>
      <path d="M36 30 Q50 40 64 30" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8"/>
    </svg>
  ),
  coat: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M22 22 L40 16 L46 28 L54 28 L60 16 L78 22 L94 38 L86 64 L78 58 L80 132 L52 132 L52 40 L48 40 L48 132 L20 132 L22 58 L14 64 L6 38 Z" fill={c1}/>
      <path d="M40 16 L48 38 L48 132 L52 132 L52 38 L60 16" fill="rgba(0,0,0,0.07)"/>
      {[44,62,82,102,120].map(y => <circle key={y} cx="47" cy={y} r="1.1" fill="rgba(0,0,0,0.4)"/>)}
    </svg>
  ),
  jacket: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M26 22 L42 18 L46 32 L54 32 L58 18 L74 22 L92 34 L84 56 L76 50 L78 116 L52 116 L52 40 L48 40 L48 116 L22 116 L24 50 L16 56 L8 34 Z" fill={c1}/>
      <path d="M42 18 L48 38 L48 116 L52 116 L52 38 L58 18" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),
  blazer: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M26 22 L44 18 L40 36 L60 36 L56 18 L74 22 L90 36 L84 60 L76 52 L78 122 L52 122 L48 56 L48 122 L22 122 L24 52 L16 60 L10 36 Z" fill={c1}/>
      <path d="M44 18 L40 36 L60 36 L56 18 L52 38 L48 38 Z" fill="rgba(0,0,0,0.08)"/>
      {/* lapel notch */}
      <path d="M40 36 L36 30 L40 26 M60 36 L64 30 L60 26" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" fill="none"/>
      {/* pocket */}
      <line x1="32" y1="70" x2="42" y2="68" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6"/>
    </svg>
  ),
  trench: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M22 22 L42 16 L48 30 L52 30 L58 16 L78 22 L94 38 L86 66 L78 60 L80 134 L20 134 L22 60 L14 66 L6 38 Z" fill={c1}/>
      <path d="M42 16 L46 30 L46 134 L54 134 L54 30 L58 16 L52 32 L48 32 Z" fill="rgba(0,0,0,0.08)"/>
      {/* belt */}
      <rect x="22" y="80" width="56" height="6" fill="rgba(0,0,0,0.12)"/>
      <rect x="46" y="78" width="8" height="10" fill="rgba(0,0,0,0.2)"/>
      {/* buttons */}
      {[42,60,98,116].map((y,i) => (
        <React.Fragment key={i}>
          <circle cx="38" cy={y} r="1" fill="rgba(0,0,0,0.4)"/>
          <circle cx="62" cy={y} r="1" fill="rgba(0,0,0,0.4)"/>
        </React.Fragment>
      ))}
    </svg>
  ),
  sneaker: (c1, c2) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M14 86 L24 70 Q40 56 56 60 L72 64 Q86 70 90 80 L92 92 Q90 100 80 100 L18 100 Q12 98 14 86 Z" fill={c1}/>
      <path d="M14 96 L92 96 Q92 102 86 102 L20 102 Q14 102 14 96 Z" fill={c2 || 'rgba(0,0,0,0.5)'}/>
      <path d="M40 70 L42 84 M50 66 L52 84 M60 64 L62 84" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8"/>
      {/* swoosh */}
      <path d="M30 84 Q50 76 70 80" stroke="rgba(0,0,0,0.15)" strokeWidth="1.4" fill="none"/>
    </svg>
  ),
  boot: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M36 14 L62 14 L66 30 L66 88 Q66 92 70 94 L88 100 Q92 102 92 108 L92 116 Q92 122 84 122 L36 122 Q32 122 32 116 L32 30 Z" fill={c1}/>
      <path d="M32 116 L92 116 L92 122 L32 122 Z" fill="rgba(0,0,0,0.3)"/>
      <line x1="36" y1="32" x2="62" y2="32" stroke="rgba(0,0,0,0.1)" strokeWidth="0.6"/>
    </svg>
  ),
  heel: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M16 90 Q26 70 50 70 L76 70 Q90 70 92 84 L92 96 Q90 102 82 102 L18 102 Q12 100 16 90 Z" fill={c1}/>
      <path d="M70 102 L78 102 L80 122 Q80 126 76 126 L72 126 Q68 126 68 122 Z" fill={c1}/>
      <path d="M16 96 L92 96 L92 102 L18 102 Z" fill="rgba(0,0,0,0.18)"/>
    </svg>
  ),
  flat: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M16 92 Q24 80 44 80 L72 80 Q92 80 92 92 L92 100 Q90 106 80 106 L20 106 Q12 104 16 92 Z" fill={c1}/>
      <path d="M16 100 L92 100 L92 106 L18 106 Z" fill="rgba(0,0,0,0.2)"/>
    </svg>
  ),
  tote: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M32 14 Q32 30 22 30 M68 14 Q68 30 78 30" fill="none" stroke={c1} strokeWidth="2.5"/>
      <path d="M16 30 L84 30 L80 122 Q50 128 20 122 Z" fill={c1}/>
      <path d="M16 30 L84 30 L82 38 L18 38 Z" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),
  shoulderBag: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M28 16 Q30 50 22 60 M72 16 Q70 50 78 60" fill="none" stroke={c1} strokeWidth="2.2"/>
      <path d="M20 60 L80 60 Q86 60 86 68 L82 110 Q50 116 18 110 L14 68 Q14 60 20 60 Z" fill={c1}/>
      <rect x="44" y="76" width="12" height="6" rx="1" fill="rgba(0,0,0,0.25)"/>
    </svg>
  ),
  clutch: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M14 56 L86 56 Q90 56 90 60 L90 96 Q90 100 86 100 L14 100 Q10 100 10 96 L10 60 Q10 56 14 56 Z" fill={c1}/>
      <path d="M14 56 L86 56 L86 74 Q50 82 14 74 Z" fill="rgba(0,0,0,0.1)"/>
      <circle cx="50" cy="78" r="2" fill="rgba(0,0,0,0.3)"/>
    </svg>
  ),
  earrings: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <circle cx="34" cy="40" r="3" fill={c1}/>
      <path d="M34 42 L34 80 Q34 88 30 88 L26 88" fill="none" stroke={c1} strokeWidth="2.5"/>
      <ellipse cx="28" cy="92" rx="6" ry="8" fill={c1}/>
      <circle cx="66" cy="40" r="3" fill={c1}/>
      <path d="M66 42 L66 80 Q66 88 70 88 L74 88" fill="none" stroke={c1} strokeWidth="2.5"/>
      <ellipse cx="72" cy="92" rx="6" ry="8" fill={c1}/>
    </svg>
  ),
  necklace: (c1, c2) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M20 30 Q50 80 80 30" fill="none" stroke={c1} strokeWidth="1.2"/>
      <circle cx="50" cy="74" r="6" fill={c2 || c1}/>
    </svg>
  ),
  scarf: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M20 28 L80 28 L84 40 L82 52 L70 64 L74 122 L62 122 L58 70 L42 70 L38 122 L26 122 L30 64 L18 52 L16 40 Z" fill={c1}/>
      <path d="M30 40 L70 40 L72 48 L60 60 L40 60 L28 48 Z" fill="rgba(0,0,0,0.1)"/>
    </svg>
  ),
  hat: (c1) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <path d="M10 80 Q50 60 90 80 L90 88 Q50 96 10 88 Z" fill={c1}/>
      <path d="M30 80 Q30 50 50 50 Q70 50 70 80" fill={c1}/>
      <path d="M30 80 L70 80 L70 86 L30 86 Z" fill="rgba(0,0,0,0.15)"/>
    </svg>
  ),
  belt: (c1, c2) => (
    <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%' }}>
      <rect x="6" y="64" width="88" height="10" rx="1" fill={c1}/>
      <rect x="42" y="60" width="14" height="18" rx="2" fill={c2 || '#C9A961'}/>
      <rect x="46" y="64" width="2" height="10" fill={c1}/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// ItemTile — single garment as a "cutout" on the warm bg
// ─────────────────────────────────────────────────────────────
function ItemTile({ shape, color, color2, width = '100%', height = '100%', bg, padding = 8, style, onClick, dark }) {
  const Render = G[shape] || G.tee;
  return (
    <div onClick={onClick} style={{
      width, height,
      background: bg || (dark ? T.dSurface : T.bg),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding,
      ...style,
    }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Render(color, color2)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FlatLay — a curated arrangement of garments for outfit collages
// Layout: tops above bottoms above shoes, accessories floating
// ─────────────────────────────────────────────────────────────
function FlatLay({ items, width = 360, height = 360, bg, dark, padding = 24, scale = 1 }) {
  // items: [{shape, color, x, y, w, h, rot}]  coords 0–1 normalized
  const W = width - padding * 2;
  const H = height - padding * 2;
  return (
    <div style={{
      position: 'relative', width, height,
      background: bg || (dark ? T.dSurfaceAlt : T.bg),
      overflow: 'hidden',
    }}>
      {items.map((it, i) => {
        const Render = G[it.shape] || G.tee;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: padding + it.x * W,
            top: padding + it.y * H,
            width: it.w * W,
            height: it.h * H,
            transform: `rotate(${it.rot || 0}deg) scale(${scale})`,
            transformOrigin: 'center',
          }}>
            {Render(it.color, it.color2)}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sample wardrobe data
// ─────────────────────────────────────────────────────────────
const WARDROBE = [
  // tops
  { id: 'w1',  shape: 'knit',      color: C.cream,    cat: 'Tops',     sub: 'Sweater',    colors:[C.cream,C.beige] },
  { id: 'w2',  shape: 'blouse',    color: C.white,    cat: 'Tops',     sub: 'Blouse',     colors:[C.white] },
  { id: 'w3',  shape: 'tee',       color: C.fog,      cat: 'Tops',     sub: 'Tee',        colors:[C.fog] },
  { id: 'w4',  shape: 'knit',      color: C.toast,    cat: 'Tops',     sub: 'Sweater',    colors:[C.toast] },
  { id: 'w5',  shape: 'buttonUp',  color: C.sky,      cat: 'Tops',     sub: 'Button-up',  colors:[C.sky] },
  { id: 'w6',  shape: 'longTee',   color: C.charcoal, cat: 'Tops',     sub: 'Long-sleeve',colors:[C.charcoal] },
  // bottoms
  { id: 'w7',  shape: 'trousers',  color: C.charcoal, cat: 'Bottoms',  sub: 'Trousers',   colors:[C.charcoal] },
  { id: 'w8',  shape: 'jeans',     color: C.denim,    cat: 'Bottoms',  sub: 'Jeans',      colors:[C.denim] },
  { id: 'w9',  shape: 'trousers',  color: C.camel,    cat: 'Bottoms',  sub: 'Trousers',   colors:[C.camel] },
  { id: 'w10', shape: 'jeans',     color: C.wash,     cat: 'Bottoms',  sub: 'Jeans',      colors:[C.wash] },
  // skirts
  { id: 'w11', shape: 'skirt',     color: C.espresso, cat: 'Skirts',   sub: 'Midi',       colors:[C.espresso] },
  { id: 'w12', shape: 'miniSkirt', color: C.cream,    cat: 'Skirts',   sub: 'Mini',       colors:[C.cream] },
  // dresses
  { id: 'w13', shape: 'dress',     color: C.sage,     cat: 'Dresses',  sub: 'Day dress',  colors:[C.sage] },
  { id: 'w14', shape: 'slipDress', color: C.blush,    cat: 'Dresses',  sub: 'Slip',       colors:[C.blush] },
  // outerwear
  { id: 'w15', shape: 'trench',    color: C.beige,    cat: 'Outerwear',sub: 'Trench',     colors:[C.beige] },
  { id: 'w16', shape: 'blazer',    color: C.charcoal, cat: 'Outerwear',sub: 'Blazer',     colors:[C.charcoal] },
  { id: 'w17', shape: 'jacket',    color: C.denim,    cat: 'Outerwear',sub: 'Denim',      colors:[C.denim] },
  { id: 'w18', shape: 'coat',      color: C.camel,    cat: 'Outerwear',sub: 'Wool coat',  colors:[C.camel] },
  // shoes
  { id: 'w19', shape: 'sneaker',   color: C.white,    color2:C.charcoal, cat: 'Shoes', sub: 'Sneakers', colors:[C.white,C.charcoal] },
  { id: 'w20', shape: 'boot',      color: C.espresso, cat: 'Shoes',    sub: 'Boot',       colors:[C.espresso] },
  { id: 'w21', shape: 'heel',      color: C.black,    cat: 'Shoes',    sub: 'Heel',       colors:[C.black] },
  { id: 'w22', shape: 'flat',      color: C.toast,    cat: 'Shoes',    sub: 'Loafer',     colors:[C.toast] },
  // bags
  { id: 'w23', shape: 'tote',      color: C.camel,    cat: 'Bags',     sub: 'Tote',       colors:[C.camel] },
  { id: 'w24', shape: 'shoulderBag',color: C.black,   cat: 'Bags',     sub: 'Shoulder',   colors:[C.black] },
  { id: 'w25', shape: 'clutch',    color: C.cream,    cat: 'Bags',     sub: 'Clutch',     colors:[C.cream] },
  // accessories & jewellery
  { id: 'w26', shape: 'scarf',     color: C.rust,     cat: 'Accessories', sub: 'Silk scarf', colors:[C.rust] },
  { id: 'w27', shape: 'belt',      color: C.espresso, color2:C.honey, cat: 'Accessories', sub: 'Belt', colors:[C.espresso,C.honey] },
  { id: 'w28', shape: 'hat',       color: C.charcoal, cat: 'Accessories', sub: 'Hat', colors:[C.charcoal] },
  { id: 'w29', shape: 'earrings',  color: C.honey,    cat: 'Jewellery',sub: 'Drop',       colors:[C.honey] },
  { id: 'w30', shape: 'necklace',  color: C.honey,    color2:C.cream, cat: 'Jewellery', sub: 'Pendant', colors:[C.honey,C.cream] },
];

// Sample outfit data — collages of items
const OUTFITS = [
  {
    id: 'o1',
    title: 'Soft monochrome',
    why: 'Cream knit and oat trousers create a tonal column; espresso boot grounds it.',
    occasion: 'Coffee · weekend',
    items: [
      { shape: 'knit',     color: C.cream,    x: 0.18, y: 0.04, w: 0.42, h: 0.40 },
      { shape: 'trousers', color: C.oat,      x: 0.38, y: 0.36, w: 0.30, h: 0.50 },
      { shape: 'boot',     color: C.espresso, x: 0.12, y: 0.62, w: 0.32, h: 0.32, rot: -8 },
      { shape: 'tote',     color: C.camel,    x: 0.62, y: 0.58, w: 0.30, h: 0.40, rot: 6 },
      { shape: 'earrings', color: C.honey,    x: 0.70, y: 0.08, w: 0.18, h: 0.24 },
    ],
  },
  {
    id: 'o2',
    title: 'Sharp & easy',
    why: 'Charcoal blazer over a slip dress reads polished without trying.',
    occasion: 'Dinner · evening',
    items: [
      { shape: 'slipDress', color: C.plum,     x: 0.32, y: 0.06, w: 0.36, h: 0.66 },
      { shape: 'blazer',    color: C.charcoal, x: 0.08, y: 0.12, w: 0.42, h: 0.54, rot: -6 },
      { shape: 'heel',      color: C.black,    x: 0.30, y: 0.66, w: 0.36, h: 0.30 },
      { shape: 'clutch',    color: C.blush,    x: 0.62, y: 0.20, w: 0.32, h: 0.34, rot: 12 },
    ],
  },
  {
    id: 'o3',
    title: 'Layered weekday',
    why: 'Trench over a knit + denim — a confident neutral mix for unsettled weather.',
    occasion: 'Work · cool',
    items: [
      { shape: 'trench', color: C.beige,    x: 0.20, y: 0.02, w: 0.50, h: 0.66 },
      { shape: 'knit',   color: C.toast,    x: 0.16, y: 0.14, w: 0.30, h: 0.30, rot: 4 },
      { shape: 'jeans',  color: C.wash,     x: 0.56, y: 0.32, w: 0.28, h: 0.50, rot: 8 },
      { shape: 'flat',   color: C.toast,    x: 0.10, y: 0.66, w: 0.32, h: 0.28, rot: -6 },
      { shape: 'scarf',  color: C.rust,     x: 0.66, y: 0.04, w: 0.26, h: 0.32 },
    ],
  },
];

Object.assign(window, { C, G, ItemTile, FlatLay, WARDROBE, OUTFITS });
