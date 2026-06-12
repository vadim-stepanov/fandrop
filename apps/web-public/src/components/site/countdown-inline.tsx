"use client";

import { useEffect, useState } from "react";

import { formatRemainingSingleUnit } from "@/lib/format-remaining";

// Single-unit countdown ("Starts in: 3 days"). Renders only while endsAt is in
// the future; ticks every second. `now` stays null until mounted (no SSR
// mismatch); initial set is deferred via queueMicrotask (React 19 purity).
export function CountdownInline({
  endsAt,
  prefix = "Starts in:",
  className = "text-[11px] font-medium text-muted-foreground",
}: {
  endsAt: string | null;
  prefix?: string;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      return;
    }
    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end) || end <= Date.now()) {
      return;
    }
    queueMicrotask(() => setNow(Date.now()));
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!endsAt || now === null) {
    return null;
  }
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end) || end <= now) {
    return null;
  }
  return (
    <span className={className}>
      {prefix} {formatRemainingSingleUnit(end - now)}
    </span>
  );
}
