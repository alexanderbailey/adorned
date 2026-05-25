// Style sheet artboards — palette, type, components, flat-lay anatomy
// Designed on wider artboards (not phone frames)

function StyleSheetPalette() {
  const swatches = [
    { hex: '#FAFAF7', name: 'Off-white',     role: 'Background',           text: '#1F1F1D' },
    { hex: '#FFFFFF', name: 'Surface',       role: 'Cards, sheets',         text: '#1F1F1D', border: true },
    { hex: '#F4F2EC', name: 'Surface alt',   role: 'Tonal fills',           text: '#1F1F1D' },
    { hex: '#E8E6E1', name: 'Hairline',      role: 'Borders, dividers',     text: '#1F1F1D' },
    { hex: '#A8A6A1', name: 'Subtle',        role: 'Tertiary text',         text: '#FFFFFF' },
    { hex: '#6B6B68', name: 'Muted',         role: 'Secondary text',        text: '#FFFFFF' },
    { hex: '#1F1F1D', name: 'Text',          role: 'Primary, buttons',      text: '#FFFFFF' },
    { hex: '#8B7355', name: 'Accent · Taupe',role: 'Primary action / link', text: '#FFFFFF' },
    { hex: '#EFE9DF', name: 'Accent soft',   role: 'Tagged surfaces',       text: '#8B7355' },
    { hex: '#B85A52', name: 'Heart',         role: 'Favourite only',        text: '#FFFFFF' },
    { hex: '#9A4A3A', name: 'Danger',        role: 'Destructive only',      text: '#FFFFFF' },
  ];
  return (
    <div className="ad" style={{ background: T.bg, padding: 40, minHeight: '100%' }}>
      <SheetHeader title="Palette" caption="Light mode · the chrome recedes. Saturation kept under 0.05 except the heart." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {swatches.map(s => (
          <div key={s.hex} style={{
            background: s.hex,
            border: s.border ? `1px solid ${T.border}` : 'none',
            borderRadius: 6,
            padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 88,
            color: s.text,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>{s.name}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{s.role}</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, opacity: 0.7 }}>{s.hex}</div>
          </div>
        ))}
      </div>

      {/* Dark counterparts */}
      <div style={{ marginTop: 36 }}>
        <SheetSubHeader title="Dark mode" />
        <div style={{ background: T.dBg, borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            ['#16140F','Bg'], ['#1F1C16','Surface'], ['#27231C','Surface alt'], ['#2C2820','Border'],
            ['#F2EFE8','Text'], ['#8E8A80','Muted'], ['#B49274','Accent'], ['#3A352B','Border strong'],
          ].map(([hex, name]) => (
            <div key={hex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ aspectRatio: '1.4', borderRadius: 4, background: hex, border: '1px solid rgba(255,255,255,0.04)' }}/>
              <div style={{ fontSize: 10, color: '#A8A6A1', display: 'flex', justifyContent: 'space-between' }}>
                <span>{name}</span>
                <span style={{ fontFamily: T.mono }}>{hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StyleSheetType() {
  const ramp = [
    { name: 'Display',    size: 32, weight: 600, ls: -0.8, sample: 'Pulling together some looks' },
    { name: 'Title 1',    size: 26, weight: 600, ls: -0.5, sample: 'Wool-blend trousers' },
    { name: 'Title 2',    size: 20, weight: 600, ls: -0.3, sample: 'Soft monochrome' },
    { name: 'Body large', size: 16, weight: 500, ls: -0.2, sample: 'A few sentences in your own words.' },
    { name: 'Body',       size: 14, weight: 400, ls: -0.1, sample: 'Cream knit and oat trousers create a tonal column.' },
    { name: 'Caption',    size: 13, weight: 400, ls: -0.05, sample: '8 of 20 photos · added Tuesday' },
    { name: 'Micro caps', size: 11, weight: 500, ls: 1.2, sample: 'STEP 1 OF 3', upper: true, color: T.muted },
    { name: 'Mono',       size: 11, weight: 500, ls: 0, sample: 'v0.4.2 · build 4823', mono: true, color: T.muted },
  ];
  return (
    <div className="ad" style={{ background: T.bg, padding: 40, minHeight: '100%' }}>
      <SheetHeader title="Type" caption="Inter throughout. Display sizes have tight letter-spacing; body sits comfortably at 14–15px." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ramp.map(r => (
          <div key={r.name} style={{
            display: 'grid', gridTemplateColumns: '130px 1fr',
            gap: 24, alignItems: 'baseline',
            paddingBottom: 18,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
              <div>{r.name}</div>
              <div style={{ marginTop: 4 }}>{r.size}/{r.weight}/{r.ls}</div>
            </div>
            <div style={{
              fontSize: r.size, fontWeight: r.weight, letterSpacing: r.ls,
              textTransform: r.upper ? 'uppercase' : 'none',
              fontFamily: r.mono ? T.mono : T.font,
              color: r.color || T.text,
              lineHeight: 1.2,
            }}>{r.sample}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleSheetComponents() {
  return (
    <div className="ad" style={{ background: T.bg, padding: 40, minHeight: '100%' }}>
      <SheetHeader title="Components" caption="Buttons, chips, swatches, fields — small radii, hairline borders, no shadows." />

      {/* Buttons */}
      <ComponentRow title="Buttons">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn variant="primary">Primary</Btn>
          <Btn variant="primary" style={{ opacity: 0.7 }}>Hover</Btn>
          <Btn variant="primary" style={{ opacity: 0.4 }}>Disabled</Btn>
          <Btn variant="secondary">Secondary</Btn>
          <Btn variant="accent">Accent</Btn>
          <Btn variant="ghost">Ghost</Btn>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <Btn variant="primary" size="sm">Small</Btn>
          <Btn variant="primary" size="md">Medium</Btn>
          <Btn variant="primary" size="lg">Large</Btn>
          <Btn variant="primary" leading={Icon.sparkle({ width: 14, height: 14 })}>With icon</Btn>
        </div>
      </ComponentRow>

      {/* Chips */}
      <ComponentRow title="Chips · pills">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Tops','Bottoms','Dresses','Outerwear','Shoes','Bags'].map((c,i) => (
            <Chip key={c} active={i === 0}>{c}</Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <MicroChip>Default</MicroChip>
          <MicroChip tone="soft">Soft · taupe</MicroChip>
          <MicroChip tone="outline">Outline</MicroChip>
          <MicroChip>Sweater</MicroChip>
          <MicroChip>Autumn / Winter</MicroChip>
          <MicroChip>Wool blend</MicroChip>
        </div>
      </ComponentRow>

      {/* Swatches */}
      <ComponentRow title="Swatches">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[C.cream, C.beige, C.camel, C.toast, C.charcoal, C.black, C.sage, C.rust, C.denim].map((c,i) => (
            <Swatch key={c} color={c} ring={i === 0 || i === 5} size={28}/>
          ))}
        </div>
      </ComponentRow>

      {/* Fields */}
      <ComponentRow title="Fields">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 460 }}>
          <div style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>Name</div>
            <div style={{ fontSize: 14, color: T.text }}>Cream wool sweater</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${T.accent}`, background: T.surface }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.accent, marginBottom: 4 }}>Focused</div>
            <div style={{ fontSize: 14, color: T.text }}>Editing<span style={{ display: 'inline-block', width: 1.5, height: 14, background: T.accent, marginLeft: 2, verticalAlign: 'middle' }}/></div>
          </div>
        </div>
      </ComponentRow>

      {/* Bottom tab nav */}
      <ComponentRow title="Bottom tab nav">
        <div style={{
          width: 320, position: 'relative',
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', paddingBottom: 12,
        }}>
          <div style={{
            height: 60,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: `1px solid ${T.border}`,
          }}>
            {TABS.map((t,i) => (
              <div key={t.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                color: i === 0 ? T.text : T.subtle,
              }}>
                {t.icon({ width: 22, height: 22 })}
                <span style={{ fontSize: 10, fontWeight: i === 0 ? 600 : 500 }}>{t.label}</span>
              </div>
            ))}
          </div>
          {/* FAB */}
          <div style={{
            position: 'absolute', right: 12, bottom: 84,
            width: 48, height: 48, borderRadius: 24, background: T.text, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}>{Icon.plus({})}</div>
        </div>
      </ComponentRow>

      {/* Empty + loading */}
      <ComponentRow title="Empty · loading">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 540 }}>
          <div style={{
            border: `1px solid ${T.border}`, borderRadius: 8, padding: '32px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
            background: T.surface,
          }}>
            <span style={{ color: T.subtle }}>{Icon.hanger({ width: 32, height: 32 })}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Your wardrobe is empty</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Add your first item to begin.</div>
            </div>
            <Btn variant="primary" size="sm" leading={Icon.plus({ width: 14, height: 14 })}>Add item</Btn>
          </div>
          <div style={{
            border: `1px solid ${T.border}`, borderRadius: 8, padding: 16,
            background: T.surface,
          }}>
            <div className="ad-shimmer" style={{ height: 12, borderRadius: 4, width: '70%' }}/>
            <div className="ad-shimmer" style={{ height: 12, borderRadius: 4, width: '40%', marginTop: 8 }}/>
            <div className="ad-shimmer" style={{ height: 96, borderRadius: 4, marginTop: 14 }}/>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.muted }}>
              <span style={{ color: T.accent }}>{Icon.sparkle({ width: 12, height: 12 })}</span>
              Pulling together some looks…
            </div>
          </div>
        </div>
      </ComponentRow>
    </div>
  );
}

function StyleSheetFlatlay() {
  return (
    <div className="ad" style={{ background: T.bg, padding: 40, minHeight: '100%' }}>
      <SheetHeader title="Flat-lay collage" caption="The visual signature. Items breathe; tops sit above bottoms above shoes; accessories float at the edges." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32, alignItems: 'flex-start' }}>
        {/* Annotated collage */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: '#F2EFE7',
            border: `1px solid ${T.border}`,
            borderRadius: 8, overflow: 'hidden',
            position: 'relative',
            aspectRatio: '1',
          }}>
            <FlatLay items={OUTFITS[0].items} width={420} height={420} bg="transparent"/>
            {/* annotations */}
            {[
              { x: '30%', y: '8%',  label: 'Top layer', dir: 'l' },
              { x: '52%', y: '50%', label: 'Mid layer', dir: 'r' },
              { x: '22%', y: '78%', label: 'Footwear',  dir: 'l' },
              { x: '78%', y: '70%', label: 'Bag (float)', dir: 'r' },
              { x: '82%', y: '20%', label: 'Accessory (float)', dir: 'r' },
            ].map((a,i) => (
              <div key={i} style={{
                position: 'absolute', left: a.x, top: a.y,
                transform: a.dir === 'r' ? 'none' : 'translateX(-100%)',
                fontFamily: T.mono, fontSize: 9, color: T.muted, letterSpacing: 0.4,
                display: 'flex', alignItems: 'center', gap: 6, flexDirection: a.dir === 'r' ? 'row' : 'row-reverse',
              }}>
                <span style={{ width: 18, height: 1, background: T.muted }}/>
                <span style={{ background: 'rgba(250,250,247,0.85)', padding: '2px 5px', borderRadius: 2 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div>
          <SheetSubHeader title="Rules"/>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['24px', 'Padding to canvas edge'],
              ['8–12%', 'Min gap between items'],
              ['±10°', 'Soft rotation, never overlap heavy'],
              ['1 hero', 'Garment dominates; accessory rotates ±12°'],
            ].map(([k,v],i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, width: 44, flexShrink: 0 }}>{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 24 }}>
            <SheetSubHeader title="Don't"/>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
              No drop shadows. No pinterest-style overlapping. No prop styling (coffee cups, perfume bottles, leaves).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetHeader({ title, caption }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: T.accent }}>Adorned · system</div>
      <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5, margin: '6px 0 6px' }}>{title}</h2>
      {caption && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, maxWidth: 520 }}>{caption}</div>}
    </div>
  );
}

function SheetSubHeader({ title }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>
      {title}
    </div>
  );
}

function ComponentRow({ title, children }) {
  return (
    <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: `1px solid ${T.border}` }}>
      <SheetSubHeader title={title}/>
      {children}
    </div>
  );
}

Object.assign(window, {
  StyleSheetPalette, StyleSheetType, StyleSheetComponents, StyleSheetFlatlay,
});
