"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import type { ItemSeason } from "@/lib/types";

const SEASONS: ItemSeason[] = ["spring", "summer", "fall", "winter"];

export interface FilterDomain {
  subcategories: string[];
  colors: { name: string; hex: string }[];
}

export function FilterSheet({ domain }: { domain: FilterDomain }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const current = {
    subcategory: searchParams.get("subcategory"),
    color: searchParams.get("color"),
    season: searchParams.get("season"),
  };
  const activeFilterCount = Object.values(current).filter(Boolean).length;

  function applyFilter(key: "subcategory" | "color" | "season", value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `/wardrobe?${qs}` : "/wardrobe");
    });
  }

  function clearAll() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("subcategory");
    next.delete("color");
    next.delete("season");
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `/wardrobe?${qs}` : "/wardrobe");
    });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 flex items-center justify-center text-charcoal"
        aria-label="Filters"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16M7 12h10M10 19h4" />
        </svg>
        {activeFilterCount > 0 && (
          <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-charcoal/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-canvas rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline">
              <button
                onClick={clearAll}
                disabled={activeFilterCount === 0 || pending}
                className="text-[13px] text-mid disabled:opacity-30"
              >
                Clear
              </button>
              <span className="text-[15px] font-semibold tracking-[-0.2px]">Filters</span>
              <button
                onClick={() => setOpen(false)}
                className="text-[13px] text-charcoal font-medium"
              >
                Done
              </button>
            </div>

            <div className="px-5 py-5 space-y-6">
              {domain.subcategories.length > 0 && (
                <FilterSection title="Subcategory">
                  <div className="flex flex-wrap gap-2">
                    {domain.subcategories.map((sc) => (
                      <Chip
                        key={sc}
                        active={current.subcategory === sc}
                        onClick={() => applyFilter("subcategory", sc)}
                      >
                        {sc}
                      </Chip>
                    ))}
                  </div>
                </FilterSection>
              )}

              {domain.colors.length > 0 && (
                <FilterSection title="Colour">
                  <div className="flex flex-wrap gap-2">
                    {domain.colors.map((c) => (
                      <Chip
                        key={c.name}
                        active={current.color === c.name}
                        onClick={() => applyFilter("color", c.name)}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: c.hex,
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                          }}
                        />
                        {c.name}
                      </Chip>
                    ))}
                  </div>
                </FilterSection>
              )}

              <FilterSection title="Season">
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map((s) => (
                    <Chip
                      key={s}
                      active={current.season === s}
                      onClick={() => applyFilter("season", s)}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "h-8 px-3 rounded-full border text-[13px] capitalize flex items-center gap-1.5 transition-colors",
        active
          ? "bg-charcoal text-surface border-charcoal font-medium"
          : "bg-transparent text-charcoal border-border-strong"
      )}
    >
      {children}
    </button>
  );
}
