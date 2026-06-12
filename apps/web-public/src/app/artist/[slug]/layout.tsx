import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AppFooter } from "@/components/site/app-footer";
import { ArtistAuthModalProvider } from "@/components/auth/artist-auth-modal-controller";
import { ArtistBottomTabBar } from "@/components/site/artist-bottom-tab-bar";
import { ArtistNavbar } from "@/components/site/artist-navbar";
import { OnboardingMount } from "@/components/site/onboarding-mount";
import {
  getArtistHome,
  getCanAdmin,
  getMyAvatar,
  getMyBalance,
  getMyOnboarding,
  getQuestsUnclaimedCount,
} from "@/lib/artist";
import { getAccessToken, getSessionEmail } from "@/lib/session";
import { ArtistLiveRefresh } from "./artist-live-refresh";

// Shell for every artist page (Home / Store / Profile): dark navbar + mobile
// bottom tabs + footer + the auth modal. Per-viewer (reads the session cookie).
export default async function ArtistLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [artist, email, accessToken] = await Promise.all([
    getArtistHome(slug),
    getSessionEmail(),
    getAccessToken(),
  ]);
  if (!artist) {
    notFound();
  }
  const [balance, canOpenAdmin, onboarding, unclaimedQuests, avatarUrl] = await Promise.all([
    getMyBalance(slug, accessToken),
    getCanAdmin(slug, accessToken),
    getMyOnboarding(slug, accessToken),
    getQuestsUnclaimedCount(slug, accessToken),
    getMyAvatar(slug, accessToken),
  ]);
  const isSignedIn = Boolean(email);
  const displayName = email ? email.split("@")[0] : null;
  // First-join welcome modal: member who hasn't seen it AND has a bonus to claim.
  const showOnboarding = Boolean(
    onboarding?.isMember && !onboarding.hasSeenOnboarding && onboarding.welcomeBonus > 0,
  );

  return (
    <ArtistAuthModalProvider
      artistSlug={slug}
      artistName={artist.name}
      artistLogoUrl={artist.logoUrl}
    >
      <ArtistNavbar
        artistSlug={slug}
        artistName={artist.name}
        artistLogoUrl={artist.logoUrl}
        pointsBalance={balance}
        isSignedIn={isSignedIn}
        displayName={displayName}
        avatarUrl={avatarUrl}
        canOpenAdmin={canOpenAdmin}
        unclaimedQuests={unclaimedQuests}
        suppressBalanceOrbs={showOnboarding}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
      <AppFooter />
      {/* Mobile tabs are member-only (only Home is public). The spacer keeps the
          footer clear of the fixed tab bar on mobile. */}
      {isSignedIn && (
        <>
          <div className="h-16 md:hidden" aria-hidden />
          <ArtistBottomTabBar artistSlug={slug} />
        </>
      )}
      {isSignedIn && <ArtistLiveRefresh artistId={artist.id} slug={slug} />}
      {isSignedIn && (
        <OnboardingMount
          key={email ?? slug}
          shouldOpen={showOnboarding}
          artistSlug={slug}
          welcomeBonus={onboarding?.welcomeBonus ?? 0}
        />
      )}
    </ArtistAuthModalProvider>
  );
}
