// Screen 3: Item detail

function ItemDetail({ dark }) {
  const item = {
    name: 'Wool-blend trousers',
    sub: 'Trousers · Bottoms',
    desc: 'Charcoal trousers with a clean front and slight crop. Easy with knitwear in winter; pairs unexpectedly well with the cream sneaker for casual days.',
    tags: { material: 'Wool blend', season: 'Autumn / Winter', formality: 'Smart-casual' },
    colors: [C.charcoal, C.slate],
    used: 7,
  };
  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        {/* Header — back/more, transparent */}
        <Header
          dark={dark} border={false}
          bg="transparent"
          leading={<HeaderIconBtn icon={Icon.back({})} dark={dark}/>}
          trailing={<HeaderIconBtn icon={Icon.more({})} dark={dark}/>}
        />

        <div className="scroll" style={{ flex: 1, marginTop: -8 }}>
          {/* Hero — cutout on tinted background */}
          <div style={{
            width: '100%', aspectRatio: '1/1.05',
            background: dark ? T.dSurface : '#F2EFE7',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 220, height: 300 }}>
              {G.trousers(item.colors[0])}
            </div>
            {/* page dots for multiple photos */}
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 5,
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: 999,
                  background: i === 0 ? (dark ? T.dText : T.text) : (dark ? T.dBorderStrong : T.borderStrong),
                }} />
              ))}
            </div>
          </div>

          {/* Title block */}
          <div style={{ padding: '24px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
              {item.sub}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, margin: '6px 0 0', lineHeight: 1.15 }}>
              {item.name}
            </h1>
          </div>

          {/* Tag chips: category / colours / material */}
          <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* color row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, width: 80 }}>Colour</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {item.colors.map(c => (
                  <span key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}/>
                ))}
                <span style={{ fontSize: 12, color: dark ? T.dText : T.text, alignSelf: 'center', marginLeft: 4 }}>Charcoal</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, width: 80 }}>Material</span>
              <span style={{ fontSize: 13 }}>{item.tags.material}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, width: 80 }}>Season</span>
              <span style={{ fontSize: 13 }}>{item.tags.season}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, width: 80 }}>Formality</span>
              <span style={{ fontSize: 13 }}>{item.tags.formality}</span>
            </div>
          </div>

          <div style={{ height: 1, background: dark ? T.dBorder : T.border, margin: '20px 20px' }}/>

          {/* Description */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ color: T.accent }}>{Icon.sparkle({ width: 14, height: 14 })}</span>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
                From your wardrobe
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: dark ? T.dText : T.text, margin: 0 }}>
              {item.desc}
            </p>
          </div>

          {/* Used in N outfits */}
          <button style={{
            width: 'calc(100% - 40px)', margin: '24px 20px 0',
            padding: '16px 18px',
            background: dark ? T.dSurface : T.surface,
            border: `1px solid ${dark ? T.dBorder : T.border}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: dark ? T.dText : T.text,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {[C.cream, C.beige, C.toast].map((c,i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: 4, background: c,
                    marginLeft: i > 0 ? -8 : 0,
                    boxShadow: `0 0 0 1.5px ${dark ? T.dSurface : T.surface}`,
                  }}/>
                ))}
              </div>
              <span style={{ fontSize: 13 }}>Used in <strong style={{ fontWeight: 600 }}>{item.used}</strong> outfits</span>
            </div>
            <span style={{ color: dark ? T.dMuted : T.muted }}>{Icon.chevR({})}</span>
          </button>

          {/* Edit / Delete */}
          <div style={{ padding: '16px 20px 100px', display: 'flex', gap: 10 }}>
            <Btn variant="secondary" dark={dark} full leading={Icon.edit({})}>Edit</Btn>
            <Btn variant="ghost" dark={dark} leading={Icon.trash({})} style={{ width: 56, padding: 0, color: T.danger }}/>
          </div>
        </div>
      </Screen>
    </Phone>
  );
}

Object.assign(window, { ItemDetail });
