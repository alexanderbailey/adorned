"use client";

import Link from "next/link";

interface Props {
  // Current tier — used to decide whether to nudge an upgrade.
  currentTier: "standard" | "pro" | null;
  onDismiss?: () => void;
}

// Shown when the hidden daily outfit-generation cap is hit. Soft cooldown
// message + (for Standard users) a Pro upgrade nudge — NO top-up CTA. The
// abundance shape only breaks if you sell credits on the cheap habit.
export function DailyCapCooldown({ currentTier, onDismiss }: Props) {
  const resetLabel = "midnight (London)";
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xs space-y-4">
        <p className="text-[10px] font-semibold tracking-[1.2px] uppercase text-mid">
          Slow down
        </p>
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] leading-tight">
          You&apos;ve styled a lot today
        </h1>
        <p className="text-[14px] text-mid leading-[1.55]">
          Come back at {resetLabel} for a fresh batch.
        </p>

        {currentTier === "standard" && (
          <div className="pt-3 space-y-2">
            <Link
              href="/billing"
              className="block w-full h-11 leading-[44px] bg-charcoal text-surface text-[14px] font-medium rounded-[6px]"
            >
              Upgrade to Pro
            </Link>
            <p className="text-[12px] text-mid">
              Pro lifts the daily cap.
            </p>
          </div>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="block mx-auto pt-3 text-[13px] text-mid underline underline-offset-2"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
