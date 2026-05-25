// Screen 2: Wardrobe gallery + Filter sheet variant

const WARDROBE_CATEGORIES = ['All','Tops','Bottoms','Skirts','Dresses','Outerwear','Shoes','Bags','Accessories','Jewellery'];

function Wardrobe({ dark, filterOpen = false }) {
  const items = WARDROBE;
  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        {/* Header — large editorial */}
        <div style={{ padding: '6px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
            <Wordmark size={22} dark={dark} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{
                width: 36, height: 36, border: 'none', background: 'transparent',
                color: dark ? T.dText : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icon.search({})}</button>
              <button style={{
                width: 36, height: 36, border: 'none', background: 'transparent',
                color: dark ? T.dText : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icon.filter({})}</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.7, margin: 0, lineHeight: 1 }}>
              Wardrobe
            </h1>
            <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, fontFamily: T.mono, fontVariantNumeric: 'tabular-nums' }}>
              {items.length} items
            </span>
          </div>
        </div>

        {/* Category chips — horizontal scroll */}
        <div style={{
          padding: '8px 0 12px',
          overflowX: 'auto',
          borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
        }} className="scroll">
          <div style={{ display: 'flex', gap: 8, padding: '0 20px' }}>
            {WARDROBE_CATEGORIES.map((c,i) => (
              <Chip key={c} active={i === 0} dark={dark}>{c}</Chip>
            ))}
          </div>
        </div>

        {/* Grid — dense, white tiles, hairline grid */}
        <div className="scroll" style={{ flex: 1, padding: '0 0 100px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: dark ? T.dBorder : T.border,
            borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
          }}>
            {items.map(it => (
              <div key={it.id} style={{
                aspectRatio: '3/4',
                background: dark ? T.dSurface : '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <ItemTile shape={it.shape} color={it.color} color2={it.color2} dark={dark}
                  bg={dark ? T.dSurface : '#FFFFFF'} padding={6}/>
              </div>
            ))}
          </div>
        </div>

        <BottomNav active="wardrobe" dark={dark} />

        {/* Filter sheet */}
        {filterOpen && <FilterSheet dark={dark}/>}
      </Screen>
    </Phone>
  );
}

function FilterSheet({ dark }) {
  return (
    <>
      {/* scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,15,0.4)', zIndex: 50 }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: dark ? T.dSurface : T.surface,
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        zIndex: 60,
        paddingBottom: 40,
        boxShadow: '0 -12px 40px rgba(0,0,0,0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: dark ? T.dBorderStrong : T.borderStrong }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
          <button style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, background: 'transparent', border: 'none' }}>Reset</button>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: -0.2 }}>Filter</h2>
          <button style={{ fontSize: 13, color: T.accent, fontWeight: 500, background: 'transparent', border: 'none' }}>Done</button>
        </div>
        <div className="scroll" style={{ maxHeight: 480, padding: '8px 20px 20px' }}>
          {/* Subcategory */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>Subcategory</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Sweater','Tee','Blouse','Button-up','Long-sleeve','Tank'].map((c,i) => (
                <Chip key={c} active={i === 0 || i === 2} dark={dark}>{c}</Chip>
              ))}
            </div>
          </div>
          {/* Colour */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>Colour</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[C.cream,C.beige,C.camel,C.toast,C.charcoal,C.black,C.fog,C.sage,C.navy,C.denim,C.rust,C.blush].map((c,i) => (
                <Swatch key={c} color={c} ring={i === 0 || i === 3} dark={dark} size={28}/>
              ))}
            </div>
          </div>
          {/* Season */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>Season</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Spring','Summer','Autumn','Winter'].map((c,i) => (
                <Chip key={c} active={i === 2} dark={dark} style={{ flex: 1 }}>{c}</Chip>
              ))}
            </div>
          </div>
          {/* Formality */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>Formality</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Casual','Smart-casual','Formal'].map((c,i) => (
                <Chip key={c} active={i === 1} dark={dark} style={{ flex: 1 }}>{c}</Chip>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px' }}>
          <Btn variant="primary" full dark={dark}>Show 14 items</Btn>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Wardrobe, FilterSheet, WARDROBE_CATEGORIES });
