"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt, Layers, Sparkles, User } from "lucide-react";
import { clsx } from "clsx";

const tabs = [
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-canvas border-t border-hairline pb-safe z-50">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs uppercase tracking-widest transition-colors",
                active ? "text-charcoal" : "text-mid"
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
