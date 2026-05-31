"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon } from "@/components/Icon";

const tabs = [
  { href: "/wardrobe", label: "Wardrobe", icon: "checkroom" },
  { href: "/outfits",  label: "Outfits",  icon: "layers" },
  { href: "/generate", label: "Generate", icon: "auto_awesome" },
  { href: "/profile",  label: "Profile",  icon: "person" },
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
        {tabs.map(({ href, label, icon }) => {
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
              <Icon name={icon} size={22} filled={active} weight={active ? 500 : 400} />
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

      {resolvedFab && (
        <Link
          href={resolvedFab}
          className="absolute right-4 -top-16 rounded-full bg-charcoal text-surface flex items-center justify-center shadow-lg"
          style={{ width: 52, height: 52, bottom: "calc(60px + max(env(safe-area-inset-bottom, 0px), 16px) + 12px)", top: "auto" }}
          aria-label="Add"
        >
          <Icon name="add" size={26} />
        </Link>
      )}
    </nav>
  );
}
