"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// React 19-compliant hydrated flag: SSR + first client render return false,
// commit flips to true without setState-in-effect.
function useHasHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function calcTimeLeft(endMs: number) {
  const diff = Math.max(0, endMs - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    diff,
  };
}

// Live countdown when a timer is set; otherwise the CTA text (mutually
// exclusive, matching the admin editor). The two never show together.
export function PromoHeroCountdown({
  timerEndsAt,
  ctaText,
  eyebrow,
}: {
  timerEndsAt: string | null;
  ctaText: string | null;
  // Short label above the digits — only with a live timer.
  eyebrow: string | null;
}) {
  const endMs = timerEndsAt ? new Date(timerEndsAt).getTime() : null;
  const hasTimer = endMs !== null && !Number.isNaN(endMs);
  const hasHydrated = useHasHydrated();
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof calcTimeLeft> | null>(null);

  useEffect(() => {
    if (!hasTimer || endMs === null) {
      return;
    }
    const tick = () => setTimeLeft(calcTimeLeft(endMs));
    const intervalId = window.setInterval(tick, 1000);
    // First tick deferred so the effect body itself has no setState.
    queueMicrotask(tick);
    return () => window.clearInterval(intervalId);
  }, [endMs, hasTimer]);

  // Reserve height pre-hydration so the hero doesn't jump.
  if (!hasHydrated) {
    return <div aria-hidden className="h-8 md:h-12" />;
  }

  const live = hasTimer && timeLeft !== null && timeLeft.diff > 0;
  if (live && timeLeft) {
    const units = [
      { value: timeLeft.days, label: "Days" },
      { value: timeLeft.hours, label: "Hrs" },
      { value: timeLeft.minutes, label: "Min" },
      { value: timeLeft.seconds, label: "Sec" },
    ];
    return (
      <div>
        {eyebrow ? <p className="mb-2 text-sm text-white/70 md:text-base">{eyebrow}</p> : null}
        {/* Stacked units — big number + label below (standard launch-countdown). */}
        <div className="flex gap-3 md:gap-5">
          {units.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <span className="font-heading text-3xl font-extrabold leading-none tabular-nums md:text-5xl">
                {pad(unit.value)}
              </span>
              <span className="mt-1 text-[11px] font-medium text-white/75 md:text-xs">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ctaText) {
    return <p className="text-sm font-medium text-white/80">{ctaText}</p>;
  }
  return null;
}
