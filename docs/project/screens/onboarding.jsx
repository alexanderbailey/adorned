// Screen 1: Onboarding (3 steps)

// 12 color seasons grid
const SEASONS = [
  { id: 'tw',  name: 'True Winter',  swatches: ['#0A1A2E','#7E1F2C','#E8E4DD','#1E3D32','#5C2C5E','#0F4C5C','#3A2545','#9B1F38','#4E2F1E','#C7B89C','#1A1A1A','#F4E9D8'] },
  { id: 'cw',  name: 'Cool Winter',  swatches: ['#1B2E40','#5E1A2A','#E0DCD3','#2A5560','#3F2547','#A09BB8','#7C2738','#B5C3D0','#2C2530','#8C95A8','#E0CFD8','#1E1E26'] },
  { id: 'dw',  name: 'Deep Winter',  swatches: ['#0E0E14','#3C1620','#4A5060','#2A1F3F','#5D2812','#C7B89C','#1F2A38','#7C1F2C','#3A4032','#9B5A2C','#D8C8A8','#5C3F2A'] },
  { id: 'cs',  name: 'Cool Summer',  swatches: ['#7B8B9A','#A89BAE','#D8C9CC','#5D7080','#9A8BA0','#C5D1D8','#8FA0AC','#B89BAC','#3F4F60','#E0D5D8','#9B7E94','#6C8095'] },
  { id: 'ss',  name: 'Soft Summer',  swatches: ['#A89D8F','#8A92A0','#C7B8B0','#6F7A78','#B5A9B5','#D9D3CC','#9AAAB8','#9E6F88','#A8B4A2','#7A8773','#5E6D7F','#F2EBE0'] },
  { id: 'ls',  name: 'Light Summer', swatches: ['#C9D5DE','#E8D6D3','#B8C2B6','#D8C6D0','#E5DCC9','#A9B8C4','#F0E0D8','#C9B8C4','#D8E5DC','#B5C9D0','#E8CFCC','#A8B0A8'] },
  { id: 'la',  name: 'Light Autumn', swatches: ['#D8C49C','#C9A07A','#A8B098','#E5D3B8','#B8967A','#8A9874','#D8B095','#C0A574','#7E8868','#E8D8B0','#9A7855','#B8A088'] },
  { id: 'sa',  name: 'Soft Autumn',  swatches: ['#B89770','#9A7855','#A8A085','#7E6F5A','#C2A88E','#6D7B6A','#5E5240','#D2B898','#8C7B5C','#4E5B4C','#A89378','#C8B098'] },
  { id: 'da',  name: 'Deep Autumn',  swatches: ['#4A2D1A','#6B4423','#3C4030','#8C5A2C','#5C3B20','#A0764A','#7E2F1C','#2C3520','#B58850','#3F2A1A','#5F3522','#D8B889'] },
  { id: 'tsp', name: 'True Spring',  swatches: ['#E8B85C','#D87852','#8FB870','#E2C896','#C75D4A','#7BA890','#F2C870','#E89070','#A8C880','#D8A058','#5FA890','#F5E2B0'] },
  { id: 'lsp', name: 'Light Spring', swatches: ['#F2D6A8','#E8B5A0','#D5DCB8','#F5E5C8','#E8A088','#C5D6B0','#F0C5B0','#E8E0C8','#B8D8C0','#F2C8A8','#E0CDB8','#C8E0D0'] },
  { id: 'csp', name: 'Clear Spring', swatches: ['#D85234','#3FA078','#F0C840','#E07C5C','#5DAFA0','#F2A848','#C03525','#2A8A6E','#E8B028','#F25E3F','#4EC09C','#F5C760'] },
];

function OnboardingStep1({ dark }) {
  const selected = 'ss';
  const preset = SEASONS.find(s => s.id === selected);
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        {/* Top: progress + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 24, height: 3, borderRadius: 2,
                background: i === 0 ? (dark ? T.dText : T.text) : (dark ? T.dBorder : T.border),
              }} />
            ))}
          </div>
          <button style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, background: 'transparent', border: 'none' }}>Skip</button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '24px 20px 120px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, color: dark ? T.dMuted : T.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            Step 1 of 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.15 }}>
            Pick your colour palette
          </h1>
          <p style={{ fontSize: 14, color: dark ? T.dMuted : T.muted, marginTop: 8, lineHeight: 1.5 }}>
            We use 12 seasonal palettes as a starting point. Tap to preview, then edit the swatches to taste.
          </p>

          {/* 12-season grid */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SEASONS.map(s => {
              const isSel = s.id === selected;
              return (
                <div key={s.id} style={{
                  border: `1px solid ${isSel ? (dark ? T.dText : T.text) : (dark ? T.dBorder : T.border)}`,
                  background: dark ? T.dSurface : T.surface,
                  padding: '10px 8px 8px',
                  borderRadius: 6,
                  position: 'relative',
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 3, justifyItems: 'center',
                  }}>
                    {s.swatches.slice(0,12).map((c,i) => (
                      <PaintCircle key={i} color={c} size={14} seed={i*7+s.id.length} dark={dark}/>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 500, marginTop: 8, letterSpacing: -0.05, color: dark ? T.dText : T.text, textAlign: 'center' }}>
                    {s.name}
                  </div>
                  {isSel && (
                    <div style={{
                      position: 'absolute', top: -1, right: -1,
                      background: dark ? T.dText : T.text, color: dark ? T.dBg : '#fff',
                      width: 18, height: 18, borderRadius: '50% 0 6px 50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{Icon.check({ width: 10, height: 10 })}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected preset detail — grouped painted swatches */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
                Your palette · {preset.name}
              </div>
              <button style={{ fontSize: 12, color: T.accent, background: 'transparent', border: 'none', fontWeight: 500 }}>Edit</button>
            </div>

            <PaintGroup label="Neutrals · your base" dark={dark} swatches={[
              ['#F2EBE0','soft white'],['#D9CDB8','oatmeal'],
              ['#A89D8F','light taupe'],['#878481','dove grey'],
            ]}/>
            <PaintGroup label="Cools" dark={dark} swatches={[
              ['#9AAAB8','dusty blue'],['#5E6D7F','slate'],['#6F8285','smoky teal'],
            ]}/>
            <PaintGroup label="Greens" dark={dark} swatches={[
              ['#A8B4A2','sage'],['#7A8773','soft moss'],
            ]}/>
            <PaintGroup label="Warms" dark={dark} swatches={[
              ['#C8A8A8','dusty rose'],['#9E6F88','soft berry'],['#9A8475','soft mocha'],
            ]} addAction/>
          </div>
        </div>

        {/* Bottom action */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 40px',
          background: `linear-gradient(to top, ${dark ? T.dBg : T.bg} 60%, transparent)`,
        }}>
          <Btn variant="primary" full dark={dark} trailing={Icon.arrowR({})}>Continue</Btn>
        </div>
      </Screen>
    </Phone>
  );
}

function OnboardingStep2({ dark }) {
  const inspo = [
    { c: '#A89D8F' }, { c: '#C7B8B0' }, { c: '#6F7A78' },
    { c: '#8A92A0' }, { c: '#D9D3CC' }, { c: '#B5A9B5' },
    { c: '#9A8475' }, { c: '#C0B5A8' }, { c: null },
  ];
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 24, height: 3, borderRadius: 2,
                background: i <= 1 ? (dark ? T.dText : T.text) : (dark ? T.dBorder : T.border),
              }} />
            ))}
          </div>
          <button style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, background: 'transparent', border: 'none' }}>Skip</button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '24px 20px 120px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, color: dark ? T.dMuted : T.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            Step 2 of 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.15 }}>
            Describe your style
          </h1>
          <p style={{ fontSize: 14, color: dark ? T.dMuted : T.muted, marginTop: 8, lineHeight: 1.5 }}>
            A few sentences in your own words. We'll use this — plus your inspo — as the brief.
          </p>

          {/* Textarea */}
          <div style={{
            marginTop: 20,
            background: dark ? T.dSurface : T.surface,
            border: `1px solid ${dark ? T.dBorder : T.border}`,
            borderRadius: 8,
            padding: 16,
            minHeight: 120,
          }}>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: dark ? T.dText : T.text }}>
              Quiet and considered. Mostly neutrals — cream, oat, charcoal — with the occasional rust or sage. I like clothes that look better the more they're worn, and silhouettes that don't read as a uniform.
              <span style={{ display: 'inline-block', width: 1.5, height: 16, background: T.accent, marginLeft: 2, verticalAlign: 'middle', animation: 'adShimmer 1.2s infinite' }} />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 16, paddingTop: 12,
              borderTop: `1px solid ${dark ? T.dBorder : T.border}`,
            }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none',
                fontSize: 12, color: T.accent, fontWeight: 500,
              }}>
                {Icon.sparkle({ width: 14, height: 14 })} Suggest words
              </button>
              <span style={{ fontSize: 11, color: dark ? T.dSubtle : T.subtle, fontFamily: T.mono }}>248 / 500</span>
            </div>
          </div>

          {/* Inspo upload */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
                Inspo · 8 of 20
              </div>
              <span style={{ fontSize: 12, color: dark ? T.dMuted : T.muted }}>Add 5–20 photos</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {inspo.map((p,i) => (
                p.c ? (
                  <div key={i} style={{
                    aspectRatio: '3/4',
                    background: p.c,
                    borderRadius: 4,
                    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 12px, rgba(255,255,255,0.06) 12px 13px)`,
                  }} />
                ) : (
                  <button key={i} style={{
                    aspectRatio: '3/4',
                    background: dark ? T.dSurface : T.surface,
                    border: `1px dashed ${dark ? T.dBorderStrong : T.borderStrong}`,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dark ? T.dMuted : T.muted,
                  }}>{Icon.plus({ width: 20, height: 20 })}</button>
                )
              ))}
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 40px',
          background: `linear-gradient(to top, ${dark ? T.dBg : T.bg} 60%, transparent)`,
          display: 'flex', gap: 10,
        }}>
          <Btn variant="secondary" dark={dark} style={{ width: 110 }}>Back</Btn>
          <Btn variant="primary" full dark={dark} trailing={Icon.arrowR({})}>Continue</Btn>
        </div>
      </Screen>
    </Phone>
  );
}

function OnboardingStep3({ dark }) {
  return (
    <Phone dark={dark}>
      <Screen dark={dark}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 24, height: 3, borderRadius: 2,
                background: dark ? T.dText : T.text,
              }} />
            ))}
          </div>
          <button style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, background: 'transparent', border: 'none' }}>Skip</button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '24px 20px 120px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, color: dark ? T.dMuted : T.muted, textTransform: 'uppercase', marginBottom: 12 }}>
            Step 3 of 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, margin: 0, lineHeight: 1.15 }}>
            One reference photo
          </h1>
          <p style={{ fontSize: 14, color: dark ? T.dMuted : T.muted, marginTop: 8, lineHeight: 1.5 }}>
            A clear, full-body photo against a plain wall. We'll use it later to visualise outfits on you.
          </p>

          {/* Upload area — figure illustration */}
          <div style={{
            marginTop: 24,
            background: dark ? T.dSurface : T.surface,
            border: `1px solid ${dark ? T.dBorder : T.border}`,
            borderRadius: 8,
            padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              width: 160, height: 260,
              background: dark ? T.dBg : T.bg,
              borderRadius: 6,
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${dark ? T.dBorderStrong : T.borderStrong}`,
            }}>
              {/* figure silhouette */}
              <svg viewBox="0 0 100 180" style={{ width: 70, height: 130, opacity: 0.35 }}>
                <circle cx="50" cy="22" r="14" fill="none" stroke={dark ? T.dMuted : T.muted} strokeWidth="1.5"/>
                <path d="M30 50 Q50 44 70 50 L74 110 L62 110 L60 170 L52 170 L50 116 L48 170 L40 170 L38 110 L26 110 Z"
                  fill="none" stroke={dark ? T.dMuted : T.muted} strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              {/* alignment guide corners */}
              {[
                { t: 6, l: 6, br: 'tl' },
                { t: 6, r: 6, br: 'tr' },
                { b: 6, l: 6, br: 'bl' },
                { b: 6, r: 6, br: 'br' },
              ].map((g, i) => (
                <div key={i} style={{
                  position: 'absolute', top: g.t, left: g.l, right: g.r, bottom: g.b,
                  width: 14, height: 14,
                  borderTop:    g.br[0] === 't' ? `1.5px solid ${T.accent}` : 'none',
                  borderBottom: g.br[0] === 'b' ? `1.5px solid ${T.accent}` : 'none',
                  borderLeft:   g.br[1] === 'l' ? `1.5px solid ${T.accent}` : 'none',
                  borderRight:  g.br[1] === 'r' ? `1.5px solid ${T.accent}` : 'none',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, width: '100%' }}>
              <Btn variant="primary" dark={dark} full leading={Icon.camera({ width: 18, height: 18 })}>Take photo</Btn>
              <Btn variant="secondary" dark={dark} leading={Icon.upload({ width: 18, height: 18 })} style={{ width: 56, padding: 0 }} />
            </div>
            <div style={{
              fontSize: 11, color: dark ? T.dSubtle : T.subtle,
              marginTop: 14, textAlign: 'center', lineHeight: 1.5,
            }}>
              We store this only on your device unless you turn on cloud sync.
            </div>
          </div>

          {/* tips */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Stand facing the camera, arms relaxed.',
              'Plain background — a wall or door is perfect.',
              'Wear something simple and form-fitting.',
            ].map((t,i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: dark ? T.dSurfaceAlt : T.accentSoft, color: T.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                <span style={{ fontSize: 13, color: dark ? T.dMuted : T.muted, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 40px',
          background: `linear-gradient(to top, ${dark ? T.dBg : T.bg} 60%, transparent)`,
          display: 'flex', gap: 10,
        }}>
          <Btn variant="secondary" dark={dark} style={{ width: 110 }}>Back</Btn>
          <Btn variant="primary" full dark={dark}>Finish</Btn>
        </div>
      </Screen>
    </Phone>
  );
}

Object.assign(window, { OnboardingStep1, OnboardingStep2, OnboardingStep3, SEASONS });

// Grouped painted-swatch row, like the reference chart
function PaintGroup({ label, swatches, dark, addAction, size = 36 }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase',
        color: dark ? T.dMuted : T.muted, marginBottom: 10, textAlign: 'center',
      }}>{label}</div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '14px 4px', justifyContent: 'center',
        padding: '8px 10px 12px',
        background: dark ? T.dSurface : T.surface,
        border: `1px solid ${dark ? T.dBorder : T.border}`,
        borderRadius: 8,
      }}>
        {swatches.map(([c,n], i) => (
          <PaintSwatch key={i} color={c} name={n} size={size} seed={i*11+label.length} dark={dark}/>
        ))}
        {addAction && (
          <button style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            border: 'none', background: 'transparent', padding: 0, width: size + 12,
          }}>
            <span style={{
              width: size, height: size, borderRadius: '50%',
              border: `1px dashed ${dark ? T.dBorderStrong : T.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? T.dMuted : T.muted,
            }}>{Icon.plus({ width: 14, height: 14 })}</span>
            <span style={{ fontSize: 9.5, color: dark ? T.dMuted : T.muted }}>add</span>
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PaintGroup });
