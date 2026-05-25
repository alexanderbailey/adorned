// Screen 4: Add item — single snap + bulk variants

// 4a — Camera viewfinder
function AddItemCamera({ dark }) {
  return (
    <Phone dark>
      <div className="ad" style={{ position: 'absolute', inset: 0, background: '#0A0A08', color: '#fff' }}>
        {/* Top safe area */}
        <div style={{ height: 54 }}/>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', height: 44 }}>
          <button style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 18, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.close({})}</button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Add to wardrobe</span>
          <button style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 18, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.flash({ width: 18, height: 18 })}</button>
        </div>

        {/* Viewfinder — fake darker stripe with framing guides + a faux item */}
        <div style={{
          position: 'absolute', inset: '98px 0 220px',
          background: 'linear-gradient(180deg, #2B2620 0%, #1B1814 100%)',
        }}>
          {/* Faux item being framed */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 220, height: 320, opacity: 0.95 }}>{G.knit(C.cream)}</div>
          </div>
          {/* Frame corners */}
          {[
            { t: 30, l: 30, bw: 'tl' },
            { t: 30, r: 30, bw: 'tr' },
            { b: 30, l: 30, bw: 'bl' },
            { b: 30, r: 30, bw: 'br' },
          ].map((g,i) => (
            <div key={i} style={{
              position: 'absolute', ...(g.t !== undefined && { top: g.t }), ...(g.l !== undefined && { left: g.l }),
              ...(g.r !== undefined && { right: g.r }), ...(g.b !== undefined && { bottom: g.b }),
              width: 26, height: 26,
              borderTop:    g.bw[0]==='t'?'2px solid #fff':'none',
              borderBottom: g.bw[0]==='b'?'2px solid #fff':'none',
              borderLeft:   g.bw[1]==='l'?'2px solid #fff':'none',
              borderRight:  g.bw[1]==='r'?'2px solid #fff':'none',
            }} />
          ))}
          {/* Hint */}
          <div style={{
            position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center',
            fontSize: 12, color: 'rgba(255,255,255,0.7)',
          }}>
            Fit the item in the frame
          </div>
        </div>

        {/* Bottom control bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 44px' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            <span>BULK</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>SINGLE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button style={{
              width: 48, height: 48, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.image({})}</button>
            <button style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'transparent', border: '3px solid #fff', padding: 4,
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff' }}/>
            </button>
            <button style={{
              width: 48, height: 48, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.flip({})}</button>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
          height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 8,
        }}>
          <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.7)' }}/>
        </div>
        {/* Dynamic island */}
        <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50 }}/>
        {/* Status */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 80 }}>
          <IOSStatusBar dark />
        </div>
      </div>
    </Phone>
  );
}

// 4b — Preview with bg removed + edit tag form
function AddItemReview({ dark }) {
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <Header
          dark={dark} border
          title="Review item"
          leading={<HeaderIconBtn icon={Icon.close({})} dark={dark}/>}
          trailing={<button style={{ height: 32, padding: '0 14px', border: 'none', background: T.text, color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Save</button>}
        />

        <div className="scroll" style={{ flex: 1 }}>
          {/* Preview — cutout on the warm bg, with a small badge */}
          <div style={{
            width: '100%', height: 320,
            background: dark ? T.dSurface : '#F0EDE3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            borderBottom: `1px solid ${dark ? T.dBorder : T.border}`,
          }}>
            <div style={{ width: 200, height: 280 }}>{G.knit(C.cream)}</div>
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(20,18,15,0.85)', color: '#fff',
              padding: '6px 10px', borderRadius: 6,
              fontSize: 11, fontWeight: 500, letterSpacing: -0.05,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: '#F4E5BA' }}>{Icon.sparkle({ width: 12, height: 12 })}</span>
              Background removed
            </div>
            <button style={{
              position: 'absolute', top: 16, right: 16,
              padding: '6px 12px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 500, color: T.text,
            }}>Retake</button>
          </div>

          {/* Tag form */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Name */}
            <Field label="Name" dark={dark}>
              <input defaultValue="Cream wool sweater" style={{
                width: '100%', border: 'none', background: 'transparent',
                fontSize: 16, fontWeight: 500, color: dark ? T.dText : T.text, padding: 0, outline: 'none',
              }}/>
            </Field>

            {/* Category */}
            <Field label="Category" dark={dark} suggested>
              <div style={{ fontSize: 14, color: dark ? T.dText : T.text }}>Tops · Sweater</div>
            </Field>

            {/* Colors */}
            <Field label="Colour" dark={dark} suggested>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.cream, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}/>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.beige, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}/>
                <button style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `1px dashed ${dark ? T.dBorderStrong : T.borderStrong}`,
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: dark ? T.dMuted : T.muted,
                }}>{Icon.plus({ width: 12, height: 12 })}</button>
              </div>
            </Field>

            {/* Material */}
            <Field label="Material" dark={dark} suggested>
              <div style={{ fontSize: 14, color: dark ? T.dText : T.text }}>Wool blend</div>
            </Field>

            {/* Season / Formality side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Season" dark={dark}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>Autumn / Winter</span>
                  {Icon.chevD({})}
                </div>
              </Field>
              <Field label="Formality" dark={dark}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>Casual</span>
                  {Icon.chevD({})}
                </div>
              </Field>
            </div>

            {/* AI Description preview */}
            <div style={{
              padding: 14,
              background: dark ? T.dSurface : T.surfaceAlt,
              borderRadius: 8,
              border: `1px solid ${dark ? T.dBorder : T.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ color: T.accent }}>{Icon.sparkle({ width: 13, height: 13 })}</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>Suggested description</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: dark ? T.dText : T.text, margin: 0 }}>
                A soft cream chunky-knit sweater. Versatile cold-weather staple that layers under coats and over collars.
              </p>
            </div>
          </div>
        </div>
      </Screen>
    </Phone>
  );
}

function Field({ label, children, suggested, dark }) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 8,
      border: `1px solid ${dark ? T.dBorder : T.border}`,
      background: dark ? T.dSurface : T.surface,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>{label}</span>
        {suggested && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.accent, fontWeight: 500 }}>
            {Icon.sparkle({ width: 10, height: 10 })} Suggested
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// 4c — Bulk processing queue
function AddItemBulk({ dark }) {
  const queue = [
    { id: 0, shape: 'knit',     color: C.cream,    name: 'Sweater',  pct: 100, done: true },
    { id: 1, shape: 'trousers', color: C.charcoal, name: 'Trousers', pct: 100, done: true },
    { id: 2, shape: 'blouse',   color: C.sky,      name: 'Blouse',   pct: 72 },
    { id: 3, shape: 'boot',     color: C.espresso, name: 'Boots',    pct: 38 },
    { id: 4, shape: 'tote',     color: C.camel,    name: 'Tote',     pct: 12 },
    { id: 5, shape: 'jeans',    color: C.wash,     name: 'Jeans',    pct: 0 },
    { id: 6, shape: 'scarf',    color: C.rust,     name: 'Scarf',    pct: 0 },
    { id: 7, shape: 'heel',     color: C.black,    name: 'Heels',    pct: 0 },
  ];
  const total = queue.length;
  const done = queue.filter(q => q.done).length;
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <Header
          dark={dark}
          title="Adding 8 items"
          subtitle={`${done} of ${total} processed`}
          leading={<HeaderIconBtn icon={Icon.close({})} dark={dark}/>}
        />

        {/* Progress bar */}
        <div style={{ padding: '8px 20px 12px' }}>
          <div style={{
            height: 4, borderRadius: 2,
            background: dark ? T.dBorder : T.border,
            overflow: 'hidden',
          }}>
            <div style={{ width: '38%', height: '100%', background: T.accent, borderRadius: 2 }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: dark ? T.dMuted : T.muted }}>
            <span>Pulling colours and tags…</span>
            <span style={{ fontFamily: T.mono }}>2 of 8</span>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '8px 0 100px' }}>
          {queue.map(q => (
            <div key={q.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px',
              opacity: q.pct === 0 ? 0.45 : 1,
            }}>
              <div style={{
                width: 52, height: 64,
                background: dark ? T.dSurface : T.surfaceAlt,
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 36, height: 50 }}>{G[q.shape](q.color)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: dark ? T.dText : T.text }}>{q.name}</div>
                {q.done ? (
                  <div style={{ fontSize: 12, color: T.accent, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Icon.check({ width: 12, height: 12 })} Tagged · Cream, wool blend
                  </div>
                ) : q.pct > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 2, borderRadius: 1, background: dark ? T.dBorder : T.border, overflow: 'hidden' }}>
                      <div style={{ width: `${q.pct}%`, height: '100%', background: T.accent }}/>
                    </div>
                    <div style={{ fontSize: 11, color: dark ? T.dMuted : T.muted, marginTop: 4 }}>Removing background…</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: dark ? T.dSubtle : T.subtle, marginTop: 4 }}>Queued</div>
                )}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: dark ? T.dMuted : T.muted, fontVariantNumeric: 'tabular-nums' }}>
                {q.done ? '✓' : `${q.pct}%`}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 40px',
          background: dark ? T.dBg : T.bg,
          borderTop: `1px solid ${dark ? T.dBorder : T.border}`,
        }}>
          <Btn variant="primary" dark={dark} full>Review & save 8 items</Btn>
        </div>
      </Screen>
    </Phone>
  );
}

Object.assign(window, { AddItemCamera, AddItemReview, AddItemBulk });
