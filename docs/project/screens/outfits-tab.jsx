// Screen 8: Outfits tab — history & favourites

function OutfitsTab({ dark }) {
  // Generate a grid of outfit thumbnails (recycling collages w/ subtle variation)
  const grid = [
    { ...OUTFITS[0], date: '2 days ago', worn: true,  fav: true  },
    { ...OUTFITS[1], date: 'Last week',  worn: true,  fav: false },
    { ...OUTFITS[2], date: 'Last week',  worn: false, fav: true  },
    {
      id: 'g1', title: 'Easy weekend',
      items: [
        { shape: 'tee',      color: C.white,    x: 0.22, y: 0.06, w: 0.40, h: 0.38 },
        { shape: 'jeans',    color: C.wash,     x: 0.38, y: 0.34, w: 0.30, h: 0.52 },
        { shape: 'sneaker',  color: C.white, color2: C.charcoal, x: 0.15, y: 0.60, w: 0.34, h: 0.30, rot: -4 },
      ],
      date: 'Last week', worn: true,  fav: false,
    },
    {
      id: 'g2', title: 'Crisp Saturday',
      items: [
        { shape: 'jacket', color: C.denim,    x: 0.16, y: 0.08, w: 0.46, h: 0.50 },
        { shape: 'skirt',  color: C.espresso, x: 0.36, y: 0.42, w: 0.34, h: 0.48 },
        { shape: 'flat',   color: C.toast,    x: 0.20, y: 0.66, w: 0.30, h: 0.28, rot: 4 },
      ],
      date: '3 weeks ago', worn: true,  fav: true,
    },
    {
      id: 'g3', title: 'Sunday slow',
      items: [
        { shape: 'longTee', color: C.fog,      x: 0.22, y: 0.06, w: 0.42, h: 0.46 },
        { shape: 'trousers',color: C.camel,    x: 0.36, y: 0.40, w: 0.30, h: 0.50 },
        { shape: 'flat',    color: C.charcoal, x: 0.15, y: 0.66, w: 0.30, h: 0.28 },
      ],
      date: 'A month ago', worn: false, fav: false,
    },
  ];

  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        {/* Top */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
            <Wordmark size={22} dark={dark}/>
            <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: dark ? T.dText : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.filter({})}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.7, margin: 0, lineHeight: 1 }}>
              Outfits
            </h1>
            <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, fontFamily: T.mono }}>{grid.length} saved</span>
          </div>
        </div>

        {/* Toggle: All / Favourites + sort */}
        <div style={{
          padding: '14px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            background: dark ? T.dSurfaceAlt : T.surfaceAlt,
            borderRadius: 6, padding: 3,
          }}>
            {['All','Favourites'].map((s,i) => (
              <button key={s} style={{
                height: 30, padding: '0 14px', borderRadius: 4,
                border: 'none', background: i === 0 ? (dark ? T.dBg : T.surface) : 'transparent',
                color: dark ? T.dText : T.text,
                fontSize: 12, fontWeight: i === 0 ? 600 : 500,
                boxShadow: i === 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>{s}</button>
            ))}
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', color: dark ? T.dMuted : T.muted,
            fontSize: 12,
          }}>
            Most recent {Icon.chevD({ width: 12, height: 12 })}
          </button>
        </div>

        {/* Grid */}
        <div className="scroll" style={{ flex: 1, padding: '4px 16px 100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {grid.map((o, i) => (
              <OutfitGridCard key={o.id || i} outfit={o} dark={dark} />
            ))}
          </div>
        </div>

        <BottomNav active="outfits" dark={dark} />
      </Screen>
    </Phone>
  );
}

function OutfitGridCard({ outfit, dark }) {
  return (
    <div style={{
      borderRadius: 6, overflow: 'hidden',
      background: dark ? T.dSurface : T.surface,
      border: `1px solid ${dark ? T.dBorder : T.border}`,
    }}>
      <div style={{ position: 'relative' }}>
        <FlatLay items={outfit.items} width={170} height={210}
          bg={dark ? T.dBg : '#F6F3EC'} dark={dark} padding={10}/>
        {outfit.fav && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            color: T.heart, opacity: 0.95,
          }}>{Icon.heartFill({ width: 16, height: 16 })}</div>
        )}
        {!outfit.worn && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            padding: '3px 7px', borderRadius: 4,
            background: dark ? 'rgba(20,18,15,0.7)' : 'rgba(255,255,255,0.85)',
            color: dark ? T.dMuted : T.muted,
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8,
          }}>Not worn</div>
        )}
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: dark ? T.dText : T.text, lineHeight: 1.25, letterSpacing: -0.1 }}>
          {outfit.title}
        </div>
        <div style={{ fontSize: 10, color: dark ? T.dMuted : T.muted, marginTop: 3 }}>
          {outfit.date}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OutfitsTab, OutfitGridCard });
