"use client";

import { ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import type { ProfileSocialEntry } from "@/lib/artist";
import { BrandIcon } from "@/components/site/brand-icon";
import { brandSlugFor, externalHref, isValidSocialHandleOrUrl } from "@/lib/socials/social-helpers";

import { connectSocial, editSocial } from "./actions";

const SOCIAL_HANDLE_MAX = 500;

/**
 * Dual-mode modal: connect a platform (initial) or edit the stored handle/URL.
 * Shared input + validation; only title/helper/button/action differ. Edit mode
 * offers a "Visit current link" shortcut. Inline client validation; the server
 * re-validates (defence in depth) and its error shows under the field.
 */
function ConnectOrEditModal({
  artistSlug,
  entry,
  mode,
  onClose,
  onDone,
}: {
  artistSlug: string;
  entry: ProfileSocialEntry;
  mode: "connect" | "edit";
  onClose: () => void;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = mode === "edit" ? (entry.connection?.externalHandleOrUrl ?? "") : "";
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (mode === "edit") {
      inputRef.current?.select();
    }
  }, [mode]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const isValid = !isEmpty && isValidSocialHandleOrUrl(trimmed);
  const showError = touched && !isEmpty && !isValid;
  const unchanged = mode === "edit" && trimmed === initialValue.trim();
  const canSubmit = !isSaving && isValid && !unchanged;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    const input = {
      artistSlug,
      artistSocialLinkId: entry.artistSocialLinkId,
      externalHandleOrUrl: trimmed,
    };
    const result = mode === "connect" ? await connectSocial(input) : await editSocial(input);
    setIsSaving(false);
    if (result.kind === "error") {
      setErrorMessage(result.reason);
      return;
    }
    onDone();
  }

  const currentVisitHref =
    mode === "edit" && entry.connection
      ? externalHref(entry.connection.externalHandleOrUrl, entry.platformSlug)
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="size-4" />
        </button>

        <div>
          <h3
            id="social-modal-title"
            className="break-words pr-10 text-lg font-semibold text-foreground"
          >
            {mode === "connect" ? `Connect ${entry.platformLabel}` : `Edit ${entry.platformLabel}`}
          </h3>
          {mode === "connect" ? (
            <p className="mt-1 pr-10 text-sm text-muted-foreground">
              Enter your @handle or profile URL. We&apos;ll credit{" "}
              {entry.connectBonus > 0 ? (
                <span className="font-semibold text-foreground">+{entry.connectBonus} pts</span>
              ) : (
                <span>a connection badge</span>
              )}{" "}
              after you submit.
            </p>
          ) : (
            <p className="mt-1 pr-10 text-sm text-muted-foreground">
              Update your handle or URL. The {entry.connectBonus > 0 ? "bonus" : "connection"} from
              the original connect stays — no points are added or removed.
            </p>
          )}
        </div>

        {currentVisitHref && currentVisitHref !== "#" ? (
          <a
            href={currentVisitHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Visit current link
          </a>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div>
            <label
              htmlFor="social-handle-input"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              @handle or profile URL
            </label>
            <input
              id="social-handle-input"
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={`@yourhandle or https://${entry.platformSlug}.com/you`}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition ${
                showError
                  ? "border-destructive focus:border-destructive"
                  : "border-border focus:border-primary"
              }`}
              required
              minLength={1}
              maxLength={SOCIAL_HANDLE_MAX}
              aria-invalid={showError}
              aria-describedby={showError ? "social-input-error" : undefined}
            />
            {showError ? (
              <p id="social-input-error" className="mt-1 text-xs text-destructive">
                Use @handle (e.g. @username) or a full URL starting with https://
              </p>
            ) : null}
            {errorMessage ? <p className="mt-1 text-xs text-destructive">{errorMessage}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-card"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? mode === "connect"
                  ? "Connecting…"
                  : "Saving…"
                : mode === "connect"
                  ? "Connect"
                  : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SocialButton({
  entry,
  onOpen,
}: {
  entry: ProfileSocialEntry;
  onOpen: (entry: ProfileSocialEntry) => void;
}) {
  const isConnected = entry.connection !== null;
  const brandSlug = brandSlugFor(entry.platformSlug);

  const baseBtn = "flex size-11 items-center justify-center rounded-xl border transition-colors";
  const connectedBtn = "border-primary bg-primary text-primary-foreground hover:brightness-105";
  const idleBtn = "border-border bg-card text-muted-foreground hover:bg-muted";

  // Brand SVGs render via <img>, so CSS color doesn't reach them — drop opacity
  // on the idle icon to read as gray on the white card.
  // Connected sits on the violet button → force the (colored/mono) SVG white via
  // filter for contrast. Idle = brand mark dimmed to gray on the white card.
  const icon = brandSlug ? (
    <BrandIcon
      slug={brandSlug}
      alt={entry.platformLabel}
      className={isConnected ? "size-5 brightness-0 invert" : "size-5 opacity-50"}
    />
  ) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        aria-label={
          isConnected
            ? `Edit ${entry.platformLabel} (connected as ${entry.connection?.externalHandleOrUrl})`
            : `Connect ${entry.platformLabel}`
        }
        title={
          isConnected
            ? `${entry.platformLabel}: ${entry.connection?.externalHandleOrUrl} — click to edit`
            : `Connect ${entry.platformLabel}`
        }
        className={`${baseBtn} ${isConnected ? connectedBtn : idleBtn}`}
      >
        {icon}
      </button>
      {!isConnected && entry.connectBonus > 0 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          +{entry.connectBonus}
        </span>
      ) : null}
    </div>
  );
}

// Owner-only on the Profile page: connect / edit your socials. Public viewers see
// connected handles as links in the leaderboard. No disconnect (connect bonus is
// one-time).
export function ProfileSocialsBlock({
  artistSlug,
  entries,
}: {
  artistSlug: string;
  entries: ProfileSocialEntry[];
}) {
  const router = useRouter();
  const [activeEntry, setActiveEntry] = useState<ProfileSocialEntry | null>(null);

  if (entries.length === 0) {
    return null;
  }

  const activeMode: "connect" | "edit" = activeEntry?.connection ? "edit" : "connect";

  return (
    <section className="space-y-3">
      <h2 className="text-center font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Connect your socials
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {entries.map((entry) => (
          <SocialButton key={entry.artistSocialLinkId} entry={entry} onOpen={setActiveEntry} />
        ))}
      </div>

      {activeEntry ? (
        <ConnectOrEditModal
          artistSlug={artistSlug}
          entry={activeEntry}
          mode={activeMode}
          onClose={() => setActiveEntry(null)}
          onDone={() => {
            setActiveEntry(null);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}
