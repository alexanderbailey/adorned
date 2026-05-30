"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

// Custom SVG icons matching the design prototype (Phosphor-style, 1.5 stroke)
const HangerIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9V8a2 2 0 1 1 2 2"/>
    <path d="M12 9L3 17a1 1 0 0 0 .7 1.7h16.6A1 1 0 0 0 21 17l-9-8z"/>
  </svg>
);
const LayersIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l9 5-9 5-9-5 9-5z"/>
    <path d="M3 13l9 5 9-5M3 18l9 5 9-5"/>
  </svg>
);
const WandIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21L15 9M14 6l4 4M17 3v3M21 7h-3M5 14v2M4 15h2M19 13v2M18 14h2"/>
  </svg>
);
const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21a8 8 0 0 1 16 0"/>
  </svg>
);

const tabs = [
  { href: "/wardrobe", label: "Wardrobe", Icon: HangerIcon },
  { href: "/outfits",  label: "Outfits",  Icon: LayersIcon },
  { href: "/generate", label: "Generate", Icon: WandIcon },
  { href: "/profile",  label: "Profile",  Icon: UserIcon },
];

interface BottomTabBarProps {
  fabHref?: string;
}

function deriveFabHref(pathname: string | null, override?: string): string | null {
  if (override) return override;
  if (!pathname) return "/wardrobe/add";
  // Hide on routes where "add" doesn't apply.
  if (pathname.startsWith("/outfits/builder")) return null;
  if (pathname.startsWith("/wardrobe/add")) return null;
  if (pathname.startsWith("/outfits")) return "/outfits/builder";
  if (pathname.startsWith("/wardrobe")) return "/wardrobe/add";
  return null;
}

export function BottomTabBar({ fabHref }: BottomTabBarProps) {
  const pathname = usePathname();
  const resolvedFab = deriveFabHref(pathname, fabHref);

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-canvas border-t border-hairline pb-safe z-40">
      <div className="grid grid-cols-4 h-[60px]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-charcoal" : "text-subtle"
              )}
            >
              <Icon active={active} />
              <span className={clsx(
                "text-[10px] tracking-[0.1px]",
                active ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* FAB — fixed above nav */}
      {resolvedFab && (
        <Link
          href={resolvedFab}
          className="absolute right-4 -top-16 w-13 h-13 rounded-full bg-charcoal text-surface flex items-center justify-center shadow-lg"
          style={{ width: 52, height: 52, bottom: "calc(60px + max(env(safe-area-inset-bottom, 0px), 16px) + 12px)", top: "auto" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </Link>
      )}
    </nav>
  );
}
