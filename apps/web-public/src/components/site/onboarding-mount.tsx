"use client";

import { useState } from "react";

import { claimWelcomeBonus, completeOnboarding } from "@/app/artist/[slug]/onboarding-actions";
import { OnboardingDialog } from "@/components/site/onboarding-dialog";

type OnboardingMountProps = {
  /** True when the viewer is a first-time member AND a welcome bonus exists. */
  shouldOpen: boolean;
  artistSlug: string;
  welcomeBonus: number;
};

/**
 * Bridges server-side onboarding state to the imperative OnboardingDialog.
 * A local close override keeps the modal closed after completion within the
 * same client session (shouldOpen comes from server props that don't update
 * synchronously after completeOnboarding). The parent keys this by the active
 * user so it remounts (state resets) when the signed-in user changes.
 */
export function OnboardingMount({ shouldOpen, artistSlug, welcomeBonus }: OnboardingMountProps) {
  const [userClosed, setUserClosed] = useState(false);
  const open = !userClosed && shouldOpen;

  async function handleClaim() {
    await claimWelcomeBonus(artistSlug);
  }

  async function handleComplete() {
    setUserClosed(true);
    await completeOnboarding(artistSlug);
  }

  return (
    <OnboardingDialog
      open={open}
      welcomeBonus={welcomeBonus}
      onClaim={handleClaim}
      onComplete={handleComplete}
    />
  );
}
