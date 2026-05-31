"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  RectangleStackIcon as LayersOutline,
  SparklesIcon as SparklesOutline,
  UserIcon as UserOutline,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  RectangleStackIcon as LayersSolid,
  SparklesIcon as SparklesSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";

// No Heroicons match for a clothes hanger — keep this one custom.
const HangerOutline = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 9V8a2 2 0 1 1 2 2" />
    <path d="M12 9L3 17a1 1 0 0 0 .7 1.7h16.6A1 1 0 0 0 21 17l-9-8z" />
  </svg>
);
const HangerSolid = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 7.5a1.5 1.5 0 1 1 2.46 1.16l-.06.05a.75.75 0 0 0-.27.57v.43L3.46 17.43a1.5 1.5 0 0 0 1.04 2.57h15a1.5 1.5 0 0 0 1.04-2.57l-9.17-7.72v-.13a3 3 0 1 0-3.87-2.83v.25a.75.75 0 0 0 1.5 0v-.25c0-.13.05-.25.13-.33A1.5 1.5 0 0 1 10.5 7.5z"
    />
  </svg>
);

interface TabSpec {
  href: string;
  label: string;
  Outline: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  Solid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const tabs: TabSpec[] = [
  { href: "/wardrobe", label: "Wardrobe", Outline: HangerOutline,  Solid: HangerSolid },
  { href: "/outfits",  label: "Outfits",  Outline: LayersOutline,   Solid: LayersSolid },
  { href: "/generate", label: "Generate", Outline: SparklesOutline, Solid: SparklesSolid },
  { href: "/profile",  label: "Profile",  Outline: UserOutline,     Solid: UserSolid },
];

interface BottomTabBarProps {
  fabHref?: string;
}

function deriveFabHref(pathname: string | null, override?: string): string | null {
  if (override) return override;
  if (!pathname) return "/wardrobe/add";
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
        {tabs.map(({ href, label, Outline, Solid }) => {
          const active = pathname.startsWith(href);
          const Icon = active ? Solid : Outline;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-charcoal" : "text-subtle"
              )}
            >
              <Icon className="w-[22px] h-[22px]" />
              <span
                className={clsx(
                  "text-[10px] tracking-[0.1px]",
                  active ? "font-semibold" : "font-medium"
                )}
              >
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
          className="absolute right-4 -top-16 rounded-full bg-charcoal text-surface flex items-center justify-center shadow-lg"
          style={{ width: 52, height: 52, bottom: "calc(60px + max(env(safe-area-inset-bottom, 0px), 16px) + 12px)", top: "auto" }}
          aria-label="Add"
        >
          <PlusIcon className="w-6 h-6" />
        </Link>
      )}
    </nav>
  );
}
