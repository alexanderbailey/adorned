// Screen 7: Manual outfit builder

function ManualBuilder({ dark }) {
  // partial collage: knit, trousers, boots placed; tote waiting
  const placed = [
    { shape: 'knit',     color: C.toast,    x: 0.20, y: 0.06, w: 0.42, h: 0.40 },
    { shape: 'trousers', color: C.charcoal, x: 0.36, y: 0.36, w: 0.30, h: 0.52 },
    { shape: 'boot',     color: C.espresso, x: 0.16, y: 0.64, w: 0.30, h: 0.30, rot: -6 },
  ];

  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <Header dark={dark} title="New outfit"
          leading={<HeaderIconBtn icon={Icon.close({})} dark={dark}/>}
          trailing={<button style={{
            height: 32, padding: '0 14px', border: 'none', background: T.text, color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 500,
          }}>Save</button>}
        />

        {/* Canvas */}
        <div style={{
          position: 'relative',
          height: 360,
          background: dark ? T.dSurface : '#F2EFE7',
          borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
        }}>
          <FlatLay items={placed} width={390} height={360}
            bg="transparent" dark={dark}/>
          {/* corner controls */}
          <button style={{
            position: 'absolute', top: 12, right: 12,
            padding: '6px 12px', border: 'none',
            background: dark ? 'rgba(20,18,15,0.7)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 6, fontSize: 11, color: dark ? T.dText : T.text, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>{Icon.refresh({ width: 12, height: 12 })} Rearrange</button>
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            fontSize: 11, color: dark ? T.dMuted : T.muted, fontFamily: T.mono,
          }}>3 items</div>
        </div>

        {/* Bottom sheet — category drawers */}
        <div style={{
          flex: 1, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex', gap: 18, padding: '14px 20px 12px',
            borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
            overflowX: 'auto',
          }} className="scroll">
            {['Tops','Bottoms','Shoes','Outerwear','Bags','Accessories'].map((c,i) => (
              <button key={c} style={{
                background: 'transparent', border: 'none', padding: '0 0 8px',
                position: 'relative',
                fontSize: 13, fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? (dark ? T.dText : T.text) : (dark ? T.dMuted : T.muted),
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {c}
                {i === 0 && <div style={{
                  position: 'absolute', bottom: -13, left: 0, right: 0,
                  height: 1.5, background: dark ? T.dText : T.text,
                }}/>}
              </button>
            ))}
          </div>

          {/* Horizontally scrolling carousel */}
          <div className="scroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '14px 0' }}>
            <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
              {WARDROBE.filter(w => w.cat === 'Tops').map(w => {
                const isPlaced = w.shape === 'knit' && w.color === C.toast;
                return (
                  <div key={w.id} style={{
                    width: 96, height: 130,
                    background: dark ? T.dSurface : T.surface,
                    border: isPlaced ? `1.5px solid ${dark ? T.dText : T.text}` : `1px solid ${dark ? T.dBorder : T.border}`,
                    borderRadius: 6,
                    position: 'relative', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 64, height: 90 }}>{G[w.shape](w.color, w.color2)}</div>
                    {isPlaced && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 18, height: 18, borderRadius: 9,
                        background: dark ? T.dText : T.text, color: dark ? T.dBg : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{Icon.check({ width: 10, height: 10 })}</div>
                    )}
                  </div>
                );
              })}
              {/* Show me more */}
              <div style={{
                width: 96, height: 130,
                border: `1px dashed ${dark ? T.dBorderStrong : T.borderStrong}`,
                borderRadius: 6, flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                color: dark ? T.dMuted : T.muted,
              }}>
                {Icon.sparkle({ width: 16, height: 16 })}
                <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', padding: '0 6px' }}>Suggest a match</span>
              </div>
            </div>
          </div>
        </div>
      </Screen>
    </Phone>
  );
}

Object.assign(window, { ManualBuilder });
