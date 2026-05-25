// Screen 9: Profile / Settings

function Profile({ dark }) {
  const inspo = ['#A89D8F','#C7B8B0','#6F7A78','#8A92A0','#D9D3CC','#B5A9B5','#9A8475','#C0B5A8'];

  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        {/* Top */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
            <Wordmark size={22} dark={dark}/>
            <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: dark ? T.dText : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* gear */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
            </button>
          </div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: dark ? T.dSurfaceAlt : T.accentSoft,
              color: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 600,
              boxShadow: `0 0 0 1px ${dark ? T.dBorder : T.border}`,
            }}>EM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>Eleni M.</div>
              <div style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, marginTop: 2 }}>Soft Summer · 47 items · 23 outfits</div>
            </div>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '24px 20px 100px' }}>
          {/* Style summary */}
          <SectionCard
            label="Style summary"
            action="Edit"
            dark={dark}
            icon={Icon.sparkle({ width: 12, height: 12 })}
          >
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: dark ? T.dText : T.text, margin: 0 }}>
              You lean quiet and considered. Cream, oat, charcoal are your base; rust and sage break the column without raising your voice. You prefer silhouettes that don't read as a uniform — a trench with denim, a slip dress with a blazer.
            </p>
          </SectionCard>

          {/* Palette · 12 swatches grouped by family */}
          <SectionCard label="Palette" sub="Soft Summer · 12" action="Edit" dark={dark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <PaintRow label="Neutrals" dark={dark} swatches={[
                ['#F2EBE0','soft white'],['#D9CDB8','oatmeal'],
                ['#A89D8F','light taupe'],['#878481','dove grey'],
              ]}/>
              <PaintRow label="Cools" dark={dark} swatches={[
                ['#9AAAB8','dusty blue'],['#5E6D7F','slate'],['#6F8285','smoky teal'],
              ]}/>
              <PaintRow label="Greens" dark={dark} swatches={[
                ['#A8B4A2','sage'],['#7A8773','soft moss'],
              ]}/>
              <PaintRow label="Warms" dark={dark} swatches={[
                ['#C8A8A8','dusty rose'],['#9E6F88','soft berry'],['#9A8475','soft mocha'],
              ]}/>
            </div>
          </SectionCard>

          {/* Inspo */}
          <SectionCard label="Inspo" sub="8 photos" action="Reorder" dark={dark}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {inspo.map((c,i) => (
                <div key={i} style={{
                  aspectRatio: '3/4',
                  background: c,
                  borderRadius: 3,
                  backgroundImage: `repeating-linear-gradient(135deg, transparent 0 12px, rgba(255,255,255,0.06) 12px 13px)`,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 14, height: 14, borderRadius: 4,
                    background: 'rgba(20,18,15,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                  }}>{Icon.drag({ width: 10, height: 10 })}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Reference body photo */}
          <SectionCard label="Reference photo" sub="Used for visualisation" action="Replace" dark={dark}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 60, height: 80,
                background: dark ? T.dBg : T.bg,
                border: `1px solid ${dark ? T.dBorder : T.border}`,
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 60 80" style={{ width: 30, height: 60, opacity: 0.4 }}>
                  <circle cx="30" cy="14" r="7" fill={dark ? T.dMuted : T.muted}/>
                  <path d="M16 26 Q30 22 44 26 L46 50 L40 50 L38 76 L34 76 L33 54 L30 54 L29 76 L25 76 L23 50 L17 50 Z" fill={dark ? T.dMuted : T.muted}/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: dark ? T.dText : T.text, fontWeight: 500 }}>Uploaded 2 weeks ago</div>
                <div style={{ fontSize: 11, color: dark ? T.dMuted : T.muted, marginTop: 4, lineHeight: 1.5 }}>Stored on this device only.</div>
              </div>
            </div>
          </SectionCard>

          {/* Account */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>Account</div>
            <div style={{
              background: dark ? T.dSurface : T.surface,
              border: `1px solid ${dark ? T.dBorder : T.border}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              {[
                ['Cloud sync', 'Off'],
                ['Notifications', 'Weekly digest'],
                ['Appearance', 'Light'],
                ['Help & support', null],
                ['Sign out', null, T.danger],
              ].map(([label, val, color], i, a) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderTop: i === 0 ? 'none' : `1px solid ${dark ? T.dBorder : T.border}`,
                  color: color || (dark ? T.dText : T.text),
                }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: dark ? T.dMuted : T.muted }}>
                    {val}
                    {!color && Icon.chevR({})}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 10, color: dark ? T.dSubtle : T.subtle, fontFamily: T.mono }}>
            Adorned v0.4.2 · build 4823
          </div>
        </div>

        <BottomNav active="profile" dark={dark} />
      </Screen>
    </Phone>
  );
}

function SectionCard({ label, sub, action, icon, children, dark }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <span style={{ color: T.accent }}>{icon}</span>}
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>{label}</span>
          {sub && <span style={{ fontSize: 11, color: dark ? T.dSubtle : T.subtle }}>· {sub}</span>}
        </div>
        {action && <button style={{ background: 'transparent', border: 'none', color: T.accent, fontSize: 12, fontWeight: 500 }}>{action}</button>}
      </div>
      <div style={{
        background: dark ? T.dSurface : T.surface,
        border: `1px solid ${dark ? T.dBorder : T.border}`,
        borderRadius: 8,
        padding: 16,
      }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Profile });

// Compact horizontal painted-row, used inside the Profile palette card
function PaintRow({ label, swatches, dark }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 4px' }}>
        {swatches.map(([c,n], i) => (
          <PaintSwatch key={i} color={c} name={n} size={32} seed={i*13 + label.length} dark={dark}/>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { PaintRow });
