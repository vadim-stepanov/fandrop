"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const DATE_THIS_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const DATE_FULL_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Transaction timestamp in the viewer's local timezone with relative phrasing
 * (Today / Yesterday / date). The server doesn't know the viewer's TZ, so SSR
 * renders an em-dash; the client re-renders post-hydration. "Now" is captured
 * once at mount via a lazy useState initializer (no `new Date()` in render body
 * → React 19 purity-safe).
 */
export function TxHistoryTimestamp({ date }: { date: string }) {
  const isHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [nowMs] = useState(() => Date.now());

  if (!isHydrated) {
    return <>—</>;
  }

  const d = new Date(date);
  const now = new Date(nowMs);
  const yesterday = new Date(nowMs);
  yesterday.setDate(now.getDate() - 1);

  const time = TIME_FORMAT.format(d);

  if (isSameDay(d, now)) {
    return <>Today at {time}</>;
  }
  if (isSameDay(d, yesterday)) {
    return <>Yesterday at {time}</>;
  }

  const dateText =
    d.getFullYear() === now.getFullYear()
      ? DATE_THIS_YEAR_FORMAT.format(d)
      : DATE_FULL_FORMAT.format(d);

  return (
    <>
      {dateText} at {time}
    </>
  );
}
