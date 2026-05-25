// Adorned — app shell pieces (header, bottom nav, FAB)

const WIDTH = 390;
const HEIGHT = 844;

// ─────────────────────────────────────────────────────────────
// Header — minimal editorial, replaces iOS NavBar
// ─────────────────────────────────────────────────────────────
function Header({
  title, subtitle, dark,
  leading, trailing,
  large = false,
  border = true,
  bg,
  style,
}) {
  return (
    <div style={{
      position: 'relative',
      background: bg || (dark ? T.dBg : T.bg),
      borderBottom: border ? `1px solid ${dark ? T.dBorder : T.border}` : 'none',
      paddingTop: 8,
      ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 44, padding: '0 8px',
      }}>
        <div style={{ width: 56, display: 'flex', justifyContent: 'flex-start' }}>{leading}</div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          {!large && title && (
            <div style={{
              fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
              color: dark ? T.dText : T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
          )}
          {!large && subtitle && (
            <div style={{
              fontSize: 11, color: dark ? T.dMuted : T.muted,
              marginTop: 1, letterSpacing: 0,
            }}>{subtitle}</div>
          )}
        </div>
        <div style={{ width: 56, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
      </div>
      {large && title && (
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{
            fontSize: 32, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.05,
            color: dark ? T.dText : T.text,
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize: 13, color: dark ? T.dMuted : T.muted, marginTop: 6,
              letterSpacing: -0.05,
            }}>{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}

function HeaderIconBtn({ icon, onClick, dark, badge }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, border: 'none', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: dark ? T.dText : T.text, position: 'relative',
    }}>
      {icon}
      {badge && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 6, height: 6, borderRadius: 999,
          background: T.accent,
        }} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom tab nav — 4 tabs + persistent FAB
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'wardrobe', label: 'Wardrobe', icon: Icon.hanger },
  { id: 'outfits',  label: 'Outfits',  icon: Icon.layers },
  { id: 'generate', label: 'Generate', icon: Icon.wand },
  { id: 'profile',  label: 'Profile',  icon: Icon.user },
];

function BottomNav({ active = 'wardrobe', dark, onTabChange, fab = true, fabIcon, onFab }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 34, // home indicator area
      background: dark ? T.dBg : T.bg,
      borderTop: `1px solid ${dark ? T.dBorder : T.border}`,
      zIndex: 40,
    }}>
      <div style={{
        height: 60,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        position: 'relative',
      }}>
        {TABS.map(t => {
          const isActive = t.id === active;
          const col = isActive ? (dark ? T.dText : T.text) : (dark ? T.dSubtle : T.subtle);
          return (
            <button key={t.id} onClick={() => onTabChange && onTabChange(t.id)} style={{
              border: 'none', background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, color: col,
            }}>
              <div>{t.icon({ width: 22, height: 22 })}</div>
              <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: 0.1 }}>{t.label}</div>
            </button>
          );
        })}
      </div>
      {fab && (
        <button onClick={onFab} style={{
          position: 'absolute', right: 16, bottom: 80,
          width: 52, height: 52, borderRadius: 26,
          background: T.text, color: '#fff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {fabIcon || Icon.plus({ width: 24, height: 24 })}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen — full-bleed iOS screen with status bar already painted by IOSDevice
// Just wraps content in a column with proper padding above bottom nav
// ─────────────────────────────────────────────────────────────
function Screen({ children, dark, bg, pb = 94, style }) {
  return (
    <div className="ad" style={{
      width: '100%', height: '100%',
      background: bg || (dark ? T.dBg : T.bg),
      color: dark ? T.dText : T.text,
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      {/* top safe area for status bar */}
      <div style={{ height: 54, flexShrink: 0 }} />
      {children}
    </div>
  );
}

// Phone wrapper — provides iOS frame with status bar + home indicator
function Phone({ children, dark = false, width = WIDTH, height = HEIGHT }) {
  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', background: dark ? T.dBg : T.bg }}>
      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 80 }}>
        <IOSStatusBar dark={dark} />
      </div>
      {/* App content */}
      <div className="ad" style={{
        position: 'absolute', inset: 0,
        background: dark ? T.dBg : T.bg,
        color: dark ? T.dText : T.text,
      }}>
        {children}
      </div>
      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
        height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{
          width: 139, height: 5, borderRadius: 100,
          background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wordmark — Adorned
// ─────────────────────────────────────────────────────────────
function Wordmark({ size = 22, dark, style }) {
  return (
    <span style={{
      fontFamily: T.font,
      fontSize: size, fontWeight: 500,
      letterSpacing: -0.4,
      color: dark ? T.dText : T.text,
      fontStyle: 'italic',
      ...style,
    }}>Adorned</span>
  );
}

Object.assign(window, { WIDTH, HEIGHT, Header, HeaderIconBtn, BottomNav, Screen, Phone, Wordmark, TABS });
