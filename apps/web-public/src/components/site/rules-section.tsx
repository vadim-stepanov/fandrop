"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicRule } from "@/lib/artist";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";

const AUTO_ADVANCE_MS = 3000;
const SCROLL_SETTLE_MS = 150;

// Numbered steps: desktop grid (up to 5 cols), mobile infinite carousel with
// auto-advance + dot indicators.
export function RulesSection({
  title,
  subtitle,
  editHref,
  items,
}: {
  title: string;
  subtitle: string | null;
  editHref?: string;
  items: PublicRule[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchingRef = useRef(false);

  const realCount = items.length;
  // Tripled so the carousel loops silently: start in the middle copy, warp back
  // once scroll settles near an edge.
  const tripled = realCount > 0 ? [...items, ...items, ...items] : [];
  const startOffset = realCount;

  const getCardWidth = useCallback(() => {
    const el = scrollRef.current;
    const child = el?.children[0] as HTMLElement | undefined;
    return child ? child.offsetWidth + 16 : 0; // gap-4
  }, []);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearAutoTimer();
    if (isTouchingRef.current || realCount < 2) {
      return;
    }
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      if (isTouchingRef.current) return;
      const el = scrollRef.current;
      const cardW = getCardWidth();
      if (!el || cardW === 0) return;
      const curIdx = Math.round(el.scrollLeft / cardW);
      el.scrollTo({ left: cardW * (curIdx + 1), behavior: "smooth" });
    }, AUTO_ADVANCE_MS);
  }, [clearAutoTimer, getCardWidth, realCount]);

  useEffect(() => {
    if (realCount < 2) return;
    const rafId = requestAnimationFrame(() => {
      const el = scrollRef.current;
      const cardW = getCardWidth();
      if (!el || cardW === 0) return;
      el.scrollTo({ left: cardW * startOffset, behavior: "auto" });
      scheduleNext();
    });
    return () => {
      cancelAnimationFrame(rafId);
      clearAutoTimer();
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [realCount, startOffset, getCardWidth, scheduleNext, clearAutoTimer]);

  useEffect(() => {
    if (realCount < 2) return;
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const cardW = getCardWidth();
      if (cardW === 0) return;
      const idx = Math.round(el.scrollLeft / cardW);
      setActiveIndex(((idx % realCount) + realCount) % realCount);
      clearAutoTimer();
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        const cardW2 = getCardWidth();
        if (cardW2 === 0 || isTouchingRef.current) return;
        const curIdx = Math.round(el.scrollLeft / cardW2);
        if (curIdx < realCount) {
          el.scrollTo({ left: (curIdx + realCount) * cardW2, behavior: "auto" });
        } else if (curIdx >= realCount * 2) {
          el.scrollTo({ left: (curIdx - realCount) * cardW2, behavior: "auto" });
        }
        scheduleNext();
      }, SCROLL_SETTLE_MS);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [getCardWidth, realCount, clearAutoTimer, scheduleNext]);

  useEffect(() => {
    if (realCount < 2) return;
    const el = scrollRef.current;
    if (!el) return;

    const onStart = () => {
      isTouchingRef.current = true;
      clearAutoTimer();
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
    const onEnd = () => {
      isTouchingRef.current = false;
      if (!settleTimerRef.current) scheduleNext();
    };

    el.addEventListener("pointerdown", onStart, { passive: true });
    el.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("pointerup", onEnd, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    window.addEventListener("pointercancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onStart);
      el.removeEventListener("touchstart", onStart);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [realCount, clearAutoTimer, scheduleNext]);

  if (realCount === 0) {
    return null;
  }

  return (
    <section className="py-7 md:py-14">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h2 className="line-clamp-1 break-words font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          {title}
          {editHref ? (
            <span className="ml-2 align-middle">
              <AdminEditSectionLink href={editHref} label={`Edit ${title}`} />
            </span>
          ) : null}
        </h2>
        {subtitle ? (
          <p className="mt-2 line-clamp-1 break-words text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {/* Desktop: up-to-5-column grid */}
      <div
        className="hidden gap-8 md:grid"
        style={{ gridTemplateColumns: `repeat(${Math.min(realCount, 5)}, minmax(0, 1fr))` }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex min-w-0 flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary md:size-16">
              <span className="font-heading text-xl font-extrabold text-primary-foreground md:text-2xl">
                {i + 1}
              </span>
            </div>
            <h3 className="mb-2 line-clamp-1 w-full break-words font-heading text-base font-bold">
              {item.title}
            </h3>
            <p className="line-clamp-2 w-full break-words text-sm text-muted-foreground">
              {item.body ?? ""}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: infinite carousel with dot indicators */}
      <div className="min-w-0 md:hidden">
        <div
          ref={scrollRef}
          className="hide-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
        >
          {tripled.map((item, i) => {
            const positionInSet = i % realCount;
            return (
              <div
                key={i}
                className="flex w-[80vw] shrink-0 snap-center flex-col items-center rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary md:size-16">
                  <span className="font-heading text-xl font-extrabold text-primary-foreground md:text-2xl">
                    {positionInSet + 1}
                  </span>
                </div>
                <h3 className="mb-2 line-clamp-1 w-full break-words font-heading text-base font-bold">
                  {item.title}
                </h3>
                <p className="line-clamp-2 w-full break-words text-sm text-muted-foreground">
                  {item.body ?? ""}
                </p>
              </div>
            );
          })}
        </div>

        {realCount >= 2 ? (
          <div className="mt-3 flex justify-center gap-2">
            {items.map((_, i) => (
              <div
                key={i}
                className={`size-2 rounded-full transition-colors duration-200 ${
                  i === activeIndex ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
