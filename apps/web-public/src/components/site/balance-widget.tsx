"use client";

import { Zap } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  FlyingOrbsPortal,
  ORB_FADE_IN_MS,
  ORB_FLY_DURATION_MS,
  ORB_MAX_STAGGER_MS,
  type FlyingOrbSpec,
} from "@/components/site/flying-orb";

/**
 * Points-balance pill in the artist navbar, motion-driven.
 *
 * On prop change:
 *   - Increase: a cloud of ORB_COUNT gold orbs spawns to the right and flies
 *     into the pill with staggered delays; each landing pulses the pill UP and
 *     increments the counter. `suppressInternalOrbs` skips the orbs (only pulse +
 *     roll) — for when another surface emits its own orbs.
 *   - Decrease: no orbs; counter rolls down over ~800ms, pill pulses DOWN once
 *     (scale 0.85 + red glow).
 *   - Initial mount: shows the value instantly, no pulse/orbs.
 *
 * Imperative `animate(ref, ...)` (not declarative) so keyframes don't fire on
 * every mount (a declarative prop gave a phantom bounce on first paint).
 */

const ORB_COUNT = 12;
const ORB_SCATTER_RADIUS_PX = 20;
const ORB_OFFSET_FROM_WIDGET_PX = 80;
const COUNTER_DECREASE_DURATION_MS = 800;
const PULSE_PEAK_SCALE_UP = 1.18;
const PULSE_PEAK_SCALE_DOWN = 0.85;
// UP fires once per orb landing (staggered) so pulses overlap into a plateau;
// DOWN fires once and carries the rubbery hold.
const PULSE_UP_DURATION_MS = 350;
const PULSE_UP_TIMES = [0, 0.2, 0.35, 1];
const PULSE_DOWN_DURATION_MS = 600;
const PULSE_DOWN_TIMES = [0, 0.25, 0.5, 1];

const POINTS_RGB = "245, 177, 37"; // #f5b125
const DESTRUCTIVE_RGB = "239, 68, 68"; // #ef4444
const BOX_SHADOW_TRANSPARENT = "0 0 0px rgba(0,0,0,0)";
const BOX_SHADOW_POINTS_PEAK = `0 0 32px rgba(${POINTS_RGB}, 0.8)`;
const BOX_SHADOW_DESTRUCTIVE_PEAK = `0 0 32px rgba(${DESTRUCTIVE_RGB}, 0.8)`;

type BalanceWidgetProps = {
  pointsBalance: number;
  // Skip the internal orb cloud on increases (only pulse + roll) — used when
  // another surface emits its own orbs.
  suppressInternalOrbs?: boolean;
};

export function BalanceWidget({ pointsBalance, suppressInternalOrbs = false }: BalanceWidgetProps) {
  const displayed = useMotionValue(pointsBalance);
  const rounded = useTransform(displayed, (v) => Math.round(v).toLocaleString("en-US"));

  const previousProp = useRef(pointsBalance);
  const widgetRef = useRef<HTMLDivElement>(null);
  const orbIdSeq = useRef(0);

  const [orbs, setOrbs] = useState<FlyingOrbSpec[]>([]);

  function getWidgetCenter(): { x: number; y: number } | null {
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function spawnOrbs(prev: number, next: number) {
    const center = getWidgetCenter();
    if (!center) {
      displayed.set(next);
      return;
    }

    const delta = next - prev;
    const perOrb = delta / ORB_COUNT;
    const cloudCenterX = center.x + ORB_OFFSET_FROM_WIDGET_PX;
    const cloudCenterY = center.y;

    const newOrbs: FlyingOrbSpec[] = Array.from({ length: ORB_COUNT }).map(() => ({
      id: orbIdSeq.current++,
      fromX: cloudCenterX + (Math.random() - 0.5) * 2 * ORB_SCATTER_RADIUS_PX,
      fromY: cloudCenterY + (Math.random() - 0.5) * 2 * ORB_SCATTER_RADIUS_PX,
      toX: center.x,
      toY: center.y,
      delay: Math.random() * ORB_MAX_STAGGER_MS,
    }));

    setOrbs((current) => [...current, ...newOrbs]);

    // Mark the orb that lands LAST by total flight time (not array index — random
    // delays mean any can land first) to snap the counter to the exact `next`,
    // so it never overshoots.
    const totals = newOrbs.map((orb) => orb.delay + ORB_FADE_IN_MS + ORB_FLY_DURATION_MS);
    const maxTotalMs = Math.max(...totals);

    newOrbs.forEach((orb, i) => {
      const totalMs = totals[i];
      const isLastToLand = totalMs === maxTotalMs;
      window.setTimeout(() => {
        if (isLastToLand) {
          displayed.set(next);
        } else {
          displayed.set(displayed.get() + perOrb);
        }
        triggerPulseUp();
        setOrbs((current) => current.filter((existing) => existing.id !== orb.id));
      }, totalMs);
    });
  }

  function animateCounterUpInChunks(prev: number, next: number) {
    const delta = next - prev;
    const perChunk = delta / ORB_COUNT;
    for (let i = 0; i < ORB_COUNT; i += 1) {
      const stagger = (i / ORB_COUNT) * ORB_MAX_STAGGER_MS;
      const totalMs = stagger + ORB_FADE_IN_MS + ORB_FLY_DURATION_MS;
      const isLast = i === ORB_COUNT - 1;
      window.setTimeout(() => {
        if (isLast) {
          displayed.set(next);
        } else {
          displayed.set(displayed.get() + perChunk);
        }
        triggerPulseUp();
      }, totalMs);
    }
  }

  function animateCounterDown(next: number) {
    triggerPulseDown();
    animate(displayed, next, {
      duration: COUNTER_DECREASE_DURATION_MS / 1000,
      ease: "easeOut",
    });
  }

  function triggerPulseUp() {
    if (!widgetRef.current) return;
    animate(
      widgetRef.current,
      {
        scale: [1, PULSE_PEAK_SCALE_UP, PULSE_PEAK_SCALE_UP, 1],
        boxShadow: [
          BOX_SHADOW_TRANSPARENT,
          BOX_SHADOW_POINTS_PEAK,
          BOX_SHADOW_POINTS_PEAK,
          BOX_SHADOW_TRANSPARENT,
        ],
      },
      { duration: PULSE_UP_DURATION_MS / 1000, times: PULSE_UP_TIMES, ease: "easeInOut" },
    );
  }

  function triggerPulseDown() {
    if (!widgetRef.current) return;
    animate(
      widgetRef.current,
      {
        scale: [1, PULSE_PEAK_SCALE_DOWN, PULSE_PEAK_SCALE_DOWN, 1],
        boxShadow: [
          BOX_SHADOW_TRANSPARENT,
          BOX_SHADOW_DESTRUCTIVE_PEAK,
          BOX_SHADOW_DESTRUCTIVE_PEAK,
          BOX_SHADOW_TRANSPARENT,
        ],
      },
      { duration: PULSE_DOWN_DURATION_MS / 1000, times: PULSE_DOWN_TIMES, ease: "easeInOut" },
    );
  }

  useEffect(() => {
    if (pointsBalance === previousProp.current) return;

    const prev = previousProp.current;
    const next = pointsBalance;
    previousProp.current = next;

    if (next > prev) {
      if (suppressInternalOrbs) {
        animateCounterUpInChunks(prev, next);
      } else {
        spawnOrbs(prev, next);
      }
    } else {
      animateCounterDown(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsBalance]);

  return (
    <>
      <motion.div
        ref={widgetRef}
        data-balance-widget=""
        className="inline-flex items-center gap-1 rounded-full bg-points/20 px-3 py-1.5 text-points"
      >
        <Zap className="size-3.5 fill-points" />
        <motion.span className="font-heading text-sm font-bold tabular-nums">{rounded}</motion.span>
      </motion.div>

      <FlyingOrbsPortal orbs={orbs} />
    </>
  );
}
