// Screen 5: Generate tab — prompt + results

function Generate({ dark, withResults = false }) {
  const placeholders = [
    'beach lunch with friends',
    'rainy work-from-home',
    'first date · italian wine bar',
    'office, but it\'s freezing',
  ];
  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        {/* Editorial header */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
            <Wordmark size={22} dark={dark}/>
            <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: dark ? T.dText : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.calendar({})}</button>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '12px 20px 100px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.7, lineHeight: 1.1, margin: 0 }}>
            What's the occasion?
          </h1>
          <p style={{ fontSize: 14, color: dark ? T.dMuted : T.muted, marginTop: 6, lineHeight: 1.5 }}>
            Tell us a sentence or two — or pick from below.
          </p>

          {/* Prompt input */}
          <div style={{
            marginTop: 20,
            background: dark ? T.dSurface : T.surface,
            border: `1px solid ${dark ? T.dBorder : T.border}`,
            borderRadius: 10,
            minHeight: 110,
            padding: 16,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flex: 1, fontSize: 15, color: dark ? T.dSubtle : T.subtle, lineHeight: 1.5 }}>
              <span style={{ color: dark ? T.dMuted : T.faint, fontStyle: 'italic' }}>e.g. {placeholders[2]}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: `1px solid ${dark ? T.dBorder : T.border}`,
              paddingTop: 10, marginTop: 10,
            }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', color: dark ? T.dMuted : T.muted,
                fontSize: 12,
              }}>{Icon.image({ width: 14, height: 14 })} Add reference</button>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: dark ? T.dSubtle : T.subtle }}>0 / 240</span>
            </div>
          </div>

          {/* Structured chips */}
          <div style={{ marginTop: 24 }}>
            <ChipGroup label="Occasion" dark={dark} options={['Work','Casual','Dinner','Date','Wedding','Travel']} selected={['Dinner']} />
            <ChipGroup label="Weather"  dark={dark} options={['Hot','Mild','Cool','Cold','Rain']} selected={['Cool']} />
            <ChipGroup label="Formality" dark={dark} options={['Casual','Smart','Polished']} selected={['Smart']} />
            <ChipGroup label="Mood" dark={dark} options={['Soft','Quiet','Sharp','Playful']} selected={[]} />
          </div>

          {/* Style me button */}
          <div style={{ marginTop: 28 }}>
            <Btn variant="accent" size="lg" full leading={Icon.sparkle({ width: 16, height: 16 })}>Style me</Btn>
          </div>

          {withResults && <GenerateResults dark={dark}/>}
        </div>

        <BottomNav active="generate" dark={dark} />
      </Screen>
    </Phone>
  );
}

function ChipGroup({ label, options, selected = [], dark }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => (
          <Chip key={o} active={selected.includes(o)} dark={dark}>{o}</Chip>
        ))}
      </div>
    </div>
  );
}

// Results state — 3 outfit cards under the form
function GenerateResults({ dark }) {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', color: dark ? T.dMuted : T.muted }}>
          Three options
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none', color: T.accent,
          fontSize: 12, fontWeight: 500,
        }}>{Icon.refresh({ width: 12, height: 12 })} Regenerate all</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OUTFITS.map(o => (
          <OutfitCard key={o.id} outfit={o} dark={dark} />
        ))}
      </div>
    </div>
  );
}

function OutfitCard({ outfit, dark, hearted }) {
  return (
    <div style={{
      background: dark ? T.dSurface : T.surface,
      border: `1px solid ${dark ? T.dBorder : T.border}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <FlatLay items={outfit.items} width={350-32} height={280} dark={dark}
        bg={dark ? T.dBg : '#F6F3EC'}/>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, color: dark ? T.dText : T.text }}>
          {outfit.title}
        </div>
        <div style={{ fontSize: 12, color: dark ? T.dMuted : T.muted, marginTop: 4, lineHeight: 1.5 }}>
          {outfit.why}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${dark ? T.dBorder : T.border}`,
        }}>
          <div style={{ fontSize: 11, color: dark ? T.dSubtle : T.subtle, fontFamily: T.mono }}>{outfit.occasion}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{
              width: 36, height: 36, borderRadius: 6, border: 'none', background: 'transparent',
              color: hearted ? T.heart : (dark ? T.dMuted : T.muted),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{hearted ? Icon.heartFill({}) : Icon.heart({})}</button>
            <button style={{
              width: 36, height: 36, borderRadius: 6, border: 'none', background: 'transparent',
              color: dark ? T.dMuted : T.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.refresh({})}</button>
            <button style={{
              height: 36, padding: '0 14px', borderRadius: 6,
              background: dark ? T.dText : T.text, color: dark ? T.dBg : '#fff',
              border: 'none', fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>Save{Icon.arrowR({ width: 14, height: 14 })}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state — shimmer
function GenerateLoading({ dark }) {
  return (
    <Phone dark={dark}>
      <Screen dark={dark} pb={94}>
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
            <Wordmark size={22} dark={dark}/>
          </div>
        </div>
        <div className="scroll" style={{ flex: 1, padding: '12px 20px 100px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.7, lineHeight: 1.1, margin: 0 }}>
            What's the occasion?
          </h1>
          <div style={{
            marginTop: 20,
            background: dark ? T.dSurface : T.surface,
            border: `1px solid ${dark ? T.dBorder : T.border}`,
            borderRadius: 10, padding: 16,
          }}>
            <div style={{ fontSize: 15, color: dark ? T.dText : T.text }}>Dinner with friends. A wine bar.</div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: T.accent, animation: 'adShimmer 1.6s infinite' }}>{Icon.sparkle({ width: 16, height: 16 })}</span>
            <span style={{ fontSize: 13, color: dark ? T.dText : T.text, fontWeight: 500 }}>Pulling together some looks…</span>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0,1,2].map(i => (
              <div key={i} className="ad-shimmer" style={{
                height: 360,
                borderRadius: 8,
                border: `1px solid ${dark ? T.dBorder : T.border}`,
              }}/>
            ))}
          </div>
        </div>
        <BottomNav active="generate" dark={dark} />
      </Screen>
    </Phone>
  );
}

Object.assign(window, { Generate, GenerateResults, GenerateLoading, OutfitCard });
