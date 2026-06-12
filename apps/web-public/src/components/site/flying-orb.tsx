"use client";

import { Zap } from "lucide-react";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export type FlyingOrbSpec = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
};

// Visual + timing knobs shared with the balance widget so the orb-cloud looks
// identical wherever it originates.
export const ORB_FADE_IN_MS = 150;
export const ORB_FLY_DURATION_MS = 800;
export const ORB_MAX_STAGGER_MS = 250;

const POINTS_RGB = "245, 177, 37"; // #f5b125 — matches the gold points glow
const BOX_SHADOW_TRANSPARENT = "0 0 0px rgba(0,0,0,0)";
const BOX_SHADOW_ORB_PEAK = `0 0 18px rgba(${POINTS_RGB}, 0.9)`;

/**
 * Portal-mounted layer for flying orb animations. Mounts to document.body so
 * absolute positioning isn't clipped by parent overflow / transforms (navbar,
 * dialog). Hydrated flag via useSyncExternalStore (React 19: no setState in
 * effect) — server renders null, client upgrades after hydration.
 */
export function FlyingOrbsPortal({ orbs }: { orbs: FlyingOrbSpec[] }) {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!hydrated) {
    return null;
  }
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {orbs.map((orb) => (
        <FlyingOrb key={orb.id} orb={orb} />
      ))}
    </div>,
    document.body,
  );
}

function FlyingOrb({ orb }: { orb: FlyingOrbSpec }) {
  const fadeInRatio = ORB_FADE_IN_MS / (ORB_FADE_IN_MS + ORB_FLY_DURATION_MS);
  return (
    <motion.div
      className="absolute left-0 top-0"
      initial={{
        x: orb.fromX,
        y: orb.fromY,
        opacity: 0,
        scale: 1,
        boxShadow: BOX_SHADOW_TRANSPARENT,
      }}
      animate={{
        x: [orb.fromX, orb.fromX, orb.toX],
        y: [orb.fromY, orb.fromY, orb.toY],
        opacity: [0, 1, 1],
        scale: [1, 1, 0.5],
        boxShadow: [BOX_SHADOW_TRANSPARENT, BOX_SHADOW_ORB_PEAK, BOX_SHADOW_TRANSPARENT],
      }}
      transition={{
        delay: orb.delay / 1000,
        duration: (ORB_FADE_IN_MS + ORB_FLY_DURATION_MS) / 1000,
        times: [0, fadeInRatio, 1],
        ease: ["easeOut", [0.5, -0.2, 0.3, 1]],
      }}
      style={{ translateX: "-50%", translateY: "-50%", borderRadius: "50%" }}
    >
      <div className="flex size-7 items-center justify-center rounded-full bg-points text-foreground">
        <Zap className="size-4 fill-current" />
      </div>
    </motion.div>
  );
}
