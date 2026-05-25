// Screen 6: Outfit detail (with Visualise / Try-on options)
// + Visualise loading state variant

function OutfitDetail({ dark, view = 'flatlay' }) {
  // view: 'flatlay' | 'visualise-loading' | 'visualise-done'
  const o = OUTFITS[0];
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <Header dark={dark} border={false} bg="transparent"
          leading={<HeaderIconBtn icon={Icon.back({})} dark={dark}/>}
          trailing={<HeaderIconBtn icon={Icon.more({})} dark={dark}/>}
        />

        <div className="scroll" style={{ flex: 1, marginTop: -8 }}>
          {/* Hero: collage | loading shimmer | visualisation */}
          <div style={{
            width: '100%', height: 380,
            background: dark ? T.dSurface : '#F2EFE7',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
          }}>
            {view === 'flatlay' && (
              <FlatLay items={o.items} width={360} height={360} bg="transparent" dark={dark}/>
            )}
            {view === 'visualise-loading' && (
              <>
                <div className="ad-shimmer" style={{ position: 'absolute', inset: 0 }}/>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: dark ? T.dText : T.text }}>
                  <span style={{ color: T.accent }}>{Icon.sparkle({ width: 22, height: 22 })}</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Sketching the look on you…</div>
                  <div style={{ fontSize: 11, color: dark ? T.dMuted : T.muted, fontFamily: T.mono }}>about 20 seconds</div>
                </div>
              </>
            )}
            {view === 'visualise-done' && (
              <div style={{ width: 220, height: 360, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* a stylised mannequin wearing the outfit */}
                <svg viewBox="0 0 220 360" style={{ width: '100%', height: '100%' }}>
                  {/* head + neck */}
                  <circle cx="110" cy="42" r="24" fill="#D8C4B1"/>
                  <rect x="100" y="62" width="20" height="14" fill="#D8C4B1"/>
                  {/* knit body */}
                  <path d="M64 80 L98 70 Q110 76 122 70 L156 80 L170 110 L156 124 L156 200 L64 200 L64 124 L50 110 Z" fill={C.cream}/>
                  {/* trousers */}
                  <path d="M68 200 L152 200 L154 212 L142 350 L118 350 L114 230 L106 230 L102 350 L78 350 L66 212 Z" fill={C.oat}/>
                  {/* boots */}
                  <rect x="76" y="348" width="32" height="10" fill={C.espresso}/>
                  <rect x="112" y="348" width="32" height="10" fill={C.espresso}/>
                </svg>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
              {o.occasion}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, margin: '6px 0 0', lineHeight: 1.15 }}>
              {o.title}
            </h1>
            <p style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, marginTop: 10, lineHeight: 1.5, margin: '10px 0 0' }}>
              {o.why}
            </p>
          </div>

          {/* Visualise / Try-on toggles */}
          <div style={{ padding: '20px', display: 'flex', gap: 8 }}>
            <Btn variant={view === 'visualise-done' ? 'primary' : 'secondary'} size="sm" dark={dark} full
                 leading={Icon.sparkle({ width: 14, height: 14 })}>
              Visualise on me
            </Btn>
            <Btn variant="secondary" size="sm" dark={dark} full
                 leading={Icon.camera({ width: 14, height: 14 })}>
              Try it on
            </Btn>
          </div>

          {/* Item list */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>
              {o.items.length} items
            </div>
            <div style={{
              background: dark ? T.dSurface : T.surface,
              border: `1px solid ${dark ? T.dBorder : T.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              {o.items.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderTop: i === 0 ? 'none' : `1px solid ${dark ? T.dBorder : T.border}`,
                }}>
                  <div style={{
                    width: 38, height: 48,
                    background: dark ? T.dSurfaceAlt : T.bg,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 28, height: 38 }}>{G[it.shape](it.color, it.color2)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: dark ? T.dText : T.text }}>
                      {it.shape === 'knit' && 'Cream wool sweater'}
                      {it.shape === 'trousers' && 'Oat wool trousers'}
                      {it.shape === 'boot' && 'Espresso ankle boot'}
                      {it.shape === 'tote' && 'Camel canvas tote'}
                      {it.shape === 'earrings' && 'Gold drop earrings'}
                    </div>
                    <div style={{ fontSize: 11, color: dark ? T.dMuted : T.muted, marginTop: 2 }}>
                      {it.shape === 'knit' && 'Sweater · Tops'}
                      {it.shape === 'trousers' && 'Trousers · Bottoms'}
                      {it.shape === 'boot' && 'Boot · Shoes'}
                      {it.shape === 'tote' && 'Tote · Bags'}
                      {it.shape === 'earrings' && 'Drop · Jewellery'}
                    </div>
                  </div>
                  <span style={{ color: dark ? T.dMuted : T.muted }}>{Icon.chevR({})}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '20px 20px 60px', display: 'flex', gap: 10 }}>
            <Btn variant="ghost" dark={dark}
                 leading={<span style={{ color: T.heart }}>{Icon.heartFill({})}</span>}
                 style={{ width: 54, padding: 0, border: `1px solid ${dark ? T.dBorder : T.border}` }}/>
            <Btn variant="secondary" dark={dark} full leading={Icon.calendar({})}>
              Mark as worn
            </Btn>
          </div>
        </div>
      </Screen>
    </Phone>
  );
}

Object.assign(window, { OutfitDetail });
