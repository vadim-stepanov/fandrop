"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

import { toUploadPath } from "@/lib/media";
import { EmailOtpForm } from "./email-otp-form";

// In-page auth modal for unauthenticated viewers on an artist route: dim+blur
// overlay + centered card with artist branding + the OTP sign-in form. Sign-in
// and sign-up are the same flow. Shows an optional referral-code field when the
// artist runs a referral program. (OAuth is deferred.)
export function ArtistAuthModal({
  artistSlug,
  artistName,
  artistLogoUrl,
  referralEnabled,
  referralRewardPoints,
  onClose,
}: {
  artistSlug: string;
  artistName: string;
  artistLogoUrl: string | null;
  referralEnabled: boolean;
  referralRewardPoints: number;
  onClose: () => void;
}) {
  const router = useRouter();
  // startTransition wraps router.refresh() so the post-login re-render doesn't
  // flash a loading state — current content stays visible.
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSuccess() {
    onClose();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sign in to ${artistName}`}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-col items-center gap-3 pb-5 pt-2">
            {artistLogoUrl ? (
              <Image
                src={toUploadPath(artistLogoUrl)}
                alt={artistName}
                width={64}
                height={64}
                className="size-16 rounded-xl object-contain"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-bold text-zinc-500">
                {artistName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center text-lg font-bold uppercase tracking-wide wrap-anywhere text-zinc-900">
              {artistName}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5">
            <h2 className="mb-5 text-center text-xl font-bold text-zinc-900">Sign in or sign up</h2>
            <EmailOtpForm
              onSuccess={handleSuccess}
              artistSlug={artistSlug}
              referralEnabled={referralEnabled}
              referralRewardPoints={referralRewardPoints}
            />
          </div>
        </div>
      </div>
    </>
  );
}
