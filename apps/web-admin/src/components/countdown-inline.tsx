import { useEffect, useState } from "react";

import { formatRemainingSingleUnit } from "@/lib/format-remaining";

// Single-unit countdown ("Starts in: 3 days") for store/quest previews. Renders
// only while endsAt is in the future; ticks every second. Initial set deferred
// via queueMicrotask (no sync setState in effect).
export function CountdownInline({
  endsAt,
  prefix = "Starts in:",
  className = "text-xs font-medium text-muted-foreground",
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
