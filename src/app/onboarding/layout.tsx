"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { path: "/onboarding/palette", label: "Palette" },
  { path: "/onboarding/style",   label: "Style"   },
  { path: "/onboarding/body",    label: "Body"    },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const stepIndex = STEPS.findIndex((s) => pathname?.startsWith(s.path));
  const current = stepIndex < 0 ? 0 : stepIndex;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="px-5 pt-[54px] pb-4 border-b border-hairline">
        <div className="flex items-center gap-2 mb-3">
          {STEPS.map((s, i) => (
            <span
              key={s.path}
              className={`h-[3px] flex-1 rounded-full ${
                i <= current ? "bg-charcoal" : "bg-hairline"
              }`}
            />
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-charcoal">
            {STEPS[current]?.label}
          </h1>
          <span className="text-[12px] text-mid font-mono tabular-nums">
            {current + 1} / {STEPS.length}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="text-center py-3 pb-safe">
        <Link href="/wardrobe" className="text-[12px] text-mid underline underline-offset-2">
          Skip for now
        </Link>
      </footer>
    </div>
  );
}
