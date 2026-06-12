"use client";

import { BookOpen, CreditCard, Trophy, Zap, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  FlyingOrbsPortal,
  ORB_FADE_IN_MS,
  ORB_FLY_DURATION_MS,
  ORB_MAX_STAGGER_MS,
  type FlyingOrbSpec,
} from "@/components/site/flying-orb";

const ORB_COUNT = 12;
const ORB_SCATTER_RADIUS_PX = 20;
// Advance to the next screen right as the first orbs reach the widget
// (≈ fade-in + fly), minus a small lead so the change reads "as coins arrive".
const ADVANCE_AFTER_CLAIM_MS = ORB_FADE_IN_MS + ORB_FLY_DURATION_MS - 200; // 750ms

type OnboardingDialogProps = {
  open: boolean;
  /** Welcome bonus amount (artist's signupBonusPoints, > 0). */
  welcomeBonus: number;
  /** Credits the bonus server-side. Resolves once credited. */
  onClaim: () => Promise<void>;
  /** Flips hasSeenOnboarding so the modal never shows again for this user. */
  onComplete: () => Promise<void> | void;
};

type Step = {
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
  buttonLabel: string;
  showBonusBadge?: boolean;
};

/**
 * Lifecycle wrapper. The flow (with its step state) mounts only while open, so
 * each open starts fresh. The modal is locked: no close button, no ESC/overlay
 * dismissal — the only way out is the final button, which calls onComplete.
 * Closing early would leave the user unsure whether they got their bonus.
 */
export function OnboardingDialog({
  open,
  welcomeBonus,
  onClaim,
  onComplete,
}: OnboardingDialogProps) {
  if (!open) {
    return null;
  }
  return <OnboardingFlow welcomeBonus={welcomeBonus} onClaim={onClaim} onComplete={onComplete} />;
}

function OnboardingFlow({
  welcomeBonus,
  onClaim,
  onComplete,
}: Omit<OnboardingDialogProps, "open">) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [, startTransition] = useTransition();
  const iconRef = useRef<HTMLDivElement>(null);
  const orbIdSeq = useRef(0);
  const [orbs, setOrbs] = useState<FlyingOrbSpec[]>([]);

  // Synchronous re-entry guard: React state is async, so a rapid double-click on
  // "Claim points" reaches the handler twice before setClaimed commits — firing
  // two orb spawns + two server claims. A ref blocks the second entry without
  // visually disabling the button.
  const inFlightRef = useRef(false);

  const steps: Step[] = [
    {
      icon: CreditCard,
      title: "You've got a Welcome bonus!",
      body: (
        <>
          <span className="font-bold text-points">+{welcomeBonus} points</span> added.
          <br />
          You just joined the competition!
        </>
      ),
      buttonLabel: claimed ? "Continue" : "Claim points",
      showBonusBadge: true,
    },
    {
      icon: Trophy,
      title: "Nice! You're in!",
      body: <>Let&apos;s get you on the leaderboard.</>,
      buttonLabel: "Let's go!",
    },
    {
      icon: BookOpen,
      title: "Earn more, climb higher",
      body: (
        <>
          Earn points from every purchase{" "}
          <span className="font-bold text-foreground">and by inviting friends</span>.
          <br />
          Top fans win exclusive drops!
        </>
      ),
      buttonLabel: "Let's go!",
    },
  ];

  const current = steps[stepIndex];
  const Icon = current.icon;
  const isLast = stepIndex === steps.length - 1;

  async function handleAction() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    try {
      if (stepIndex === 0 && !claimed) {
        // Spawn orbs FROM the modal icon TO the balance widget. Pure visual;
        // the server claim runs in parallel.
        const iconRect = iconRef.current?.getBoundingClientRect();
        const widget =
          typeof document !== "undefined"
            ? document.querySelector<HTMLElement>("[data-balance-widget]")
            : null;
        const widgetRect = widget?.getBoundingClientRect();
        if (iconRect && widgetRect) {
          spawnOrbsFromTo(
            { x: iconRect.left + iconRect.width / 2, y: iconRect.top + iconRect.height / 2 },
            {
              x: widgetRect.left + widgetRect.width / 2,
              y: widgetRect.top + widgetRect.height / 2,
            },
          );
        }

        // Credit server-side; refresh so the widget's prop updates and its pulse
        // + counter-roll fire. We await but don't block — orbs already fly.
        try {
          await onClaim();
        } catch {
          // Visual already happened; if credit failed, the widget prop won't
          // change and the user can refresh.
        }
        startTransition(() => router.refresh());

        setClaimed(true);
        window.setTimeout(() => setStepIndex(1), ADVANCE_AFTER_CLAIM_MS);
        return;
      }

      if (!isLast) {
        setStepIndex(stepIndex + 1);
        return;
      }

      await onComplete();
      startTransition(() => router.refresh());
    } finally {
      inFlightRef.current = false;
    }
  }

  function spawnOrbsFromTo(from: { x: number; y: number }, to: { x: number; y: number }) {
    const newOrbs: FlyingOrbSpec[] = Array.from({ length: ORB_COUNT }).map(() => ({
      id: orbIdSeq.current++,
      fromX: from.x + (Math.random() - 0.5) * 2 * ORB_SCATTER_RADIUS_PX,
      fromY: from.y + (Math.random() - 0.5) * 2 * ORB_SCATTER_RADIUS_PX,
      toX: to.x,
      toY: to.y,
      delay: Math.random() * ORB_MAX_STAGGER_MS,
    }));

    setOrbs((prev) => [...prev, ...newOrbs]);

    newOrbs.forEach((orb) => {
      const totalMs = orb.delay + ORB_FADE_IN_MS + ORB_FLY_DURATION_MS;
      window.setTimeout(() => {
        setOrbs((prev) => prev.filter((existing) => existing.id !== orb.id));
      }, totalMs);
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          layout
          transition={{ layout: { type: "spring", stiffness: 260, damping: 28 } }}
          className="w-[92vw] max-w-md overflow-hidden rounded-3xl border-2 border-border bg-card shadow-2xl"
        >
          <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                ref={iconRef}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(124,58,237,0.4)]"
              >
                <Icon className="size-12" strokeWidth={2.5} />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${stepIndex}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
                className="flex flex-col items-center"
              >
                <h2 className="font-heading mt-6 text-2xl leading-tight font-extrabold text-foreground md:text-3xl">
                  {current.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {current.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {current.showBonusBadge ? (
              <div className="mt-4 mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-points/40 bg-points/5 px-6 py-4">
                <Zap className="size-7 fill-points text-points" />
                <span className="font-heading text-3xl font-extrabold text-points tabular-nums">
                  +{welcomeBonus}
                </span>
              </div>
            ) : null}

            <div className="mt-4 mb-4 flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAction}
              className="font-heading h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition hover:brightness-110"
            >
              {current.buttonLabel}
            </button>
          </div>
        </motion.div>
      </div>

      <FlyingOrbsPortal orbs={orbs} />
    </>
  );
}
