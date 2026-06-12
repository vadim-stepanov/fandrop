"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { getReferralConfig } from "@/lib/auth-actions";
import { ArtistAuthModal } from "./artist-auth-modal";

type ArtistAuthModalContextValue = {
  open: () => void;
  close: () => void;
};

const ArtistAuthModalContext = createContext<ArtistAuthModalContextValue | null>(null);

// Client modal controller for the public artist subtree: exposes open()/close()
// via context so the navbar Sign-in button (or any CTA inside) toggles the auth
// modal without encoding state into the URL.
type ReferralConfig = { enabled: boolean; rewardPoints: number };

export function ArtistAuthModalProvider({
  artistSlug,
  artistName,
  artistLogoUrl,
  children,
}: {
  artistSlug: string;
  artistName: string;
  artistLogoUrl: string | null;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Fetched fresh right before opening so the optional referral field reflects
  // the current admin setting (anon pages have no realtime) AND the modal opens
  // already-correct — no reserve-then-remove jump.
  const [referral, setReferral] = useState<ReferralConfig | null>(null);

  const open = useCallback(() => {
    void (async () => {
      let cfg: ReferralConfig | null = null;
      try {
        cfg = await getReferralConfig(artistSlug);
      } catch {
        cfg = null;
      }
      setReferral(cfg);
      setIsOpen(true);
    })();
  }, [artistSlug]);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo<ArtistAuthModalContextValue>(() => ({ open, close }), [open, close]);

  return (
    <ArtistAuthModalContext.Provider value={value}>
      {children}
      {isOpen ? (
        <ArtistAuthModal
          artistSlug={artistSlug}
          artistName={artistName}
          artistLogoUrl={artistLogoUrl}
          referralEnabled={referral?.enabled ?? false}
          referralRewardPoints={referral?.rewardPoints ?? 0}
          onClose={close}
        />
      ) : null}
    </ArtistAuthModalContext.Provider>
  );
}

// Safe without a provider — returns no-ops, so the button can mount anywhere.
export function useArtistAuthModal(): ArtistAuthModalContextValue {
  return useContext(ArtistAuthModalContext) ?? { open: () => {}, close: () => {} };
}
