"use client";

import { useArtistAuthModal } from "./artist-auth-modal-controller";

// Opens the artist auth modal via context — no URL changes.
export function SigninButton({ className }: { className?: string }) {
  const { open } = useArtistAuthModal();
  return (
    <button type="button" onClick={open} className={className}>
      Sign in
    </button>
  );
}
