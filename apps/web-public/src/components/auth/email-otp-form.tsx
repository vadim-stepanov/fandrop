"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";

import { requestOtp, verifyOtp } from "@/lib/auth-actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

// Two-step email OTP (passwordless), reusable: the artist auth modal passes
// `onSuccess` to close + refresh; verify itself establishes the session
// (cookies) server-side. Same flow handles sign-in and sign-up.
export function EmailOtpForm({
  onSuccess,
  artistSlug,
  referralEnabled = false,
  referralRewardPoints = 0,
}: {
  onSuccess: () => void;
  artistSlug?: string;
  referralEnabled?: boolean;
  referralRewardPoints?: number;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const anyPending = isSending || isVerifying;
  const code = digits.join("");
  const codeComplete = code.length === OTP_LENGTH && digits.every((d) => d !== "");
  // Optional referral field. The provider fetches fresh config before opening
  // the modal, so these props are current → the field renders correctly on the
  // first paint (no reserve-then-remove jump).
  const showReferralField = referralEnabled && referralRewardPoints > 0;

  // Google sign-in carries the artist + any typed referral code via the start
  // proxy → OAuth state (no cookie). Updates live as the referral field changes.
  const googleParams = new URLSearchParams();
  if (artistSlug) {
    googleParams.set("artist", artistSlug);
  }
  if (referralCode.trim()) {
    googleParams.set("ref", referralCode.trim());
  }
  const googleHref = `/auth/google/start${googleParams.toString() ? `?${googleParams.toString()}` : ""}`;

  function handleReferralChange(raw: string) {
    setReferralCode(
      raw
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8),
    );
  }

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step === "code") {
      boxRefs.current[0]?.focus();
    }
  }, [step]);

  function startResendCooldown() {
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }
    setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendSecondsLeft((current) => {
        if (current <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function sendCode(targetEmail: string): Promise<boolean> {
    setError(null);
    setIsSending(true);
    const result = await requestOtp(targetEmail);
    setIsSending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send the code");
      return false;
    }
    startResendCooldown();
    return true;
  }

  async function handleEmailSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid || anyPending) return;
    const trimmed = email.trim();
    if (await sendCode(trimmed)) {
      setEmail(trimmed);
      setDigits(Array(OTP_LENGTH).fill(""));
      setStep("code");
    }
  }

  async function verify(submittedCode: string) {
    setError(null);
    setIsVerifying(true);
    const result = await verifyOtp(
      email,
      submittedCode,
      artistSlug,
      referralCode.trim() || undefined,
    );
    setIsVerifying(false);
    if (!result.ok) {
      setError(result.error ?? "Invalid code");
      setDigits(Array(OTP_LENGTH).fill(""));
      boxRefs.current[0]?.focus();
      return;
    }
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    onSuccess();
  }

  function fillDigits(next: string[]) {
    setDigits(next);
    if (next.every((d) => d !== "") && !isVerifying) {
      void verify(next.join(""));
    }
  }

  function handleBoxChange(index: number, rawValue: string) {
    const nextChar = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = nextChar;
    fillDigits(next);
    if (nextChar && index < OTP_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handleBoxKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      boxRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      boxRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === 0) return;
    event.preventDefault();
    const next = Array<string>(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    fillDigits(next);
    boxRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    if (resendSecondsLeft > 0 || anyPending) return;
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    await sendCode(email);
    boxRefs.current[0]?.focus();
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary disabled:opacity-60";
  const primaryButtonClass =
    "inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={anyPending}
            className={inputClass}
          />
        </div>
        {showReferralField ? (
          <div className="space-y-1">
            <label htmlFor="referral-code" className="block text-sm font-medium">
              Referral code <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="referral-code"
              type="text"
              value={referralCode}
              onChange={(event) => handleReferralChange(event.target.value)}
              placeholder="ABC123"
              autoComplete="off"
              spellCheck={false}
              disabled={anyPending}
              className={inputClass}
            />
            <p className="text-sm font-medium text-primary">
              +{referralRewardPoints.toLocaleString("en-US")} bonus points with a valid code
            </p>
          </div>
        ) : null}
        {error ? <ErrorBox message={error} /> : null}
        <button type="submit" disabled={!isEmailValid || anyPending} className={primaryButtonClass}>
          {isSending ? "Sending code…" : "Continue with email"}
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <a
          href={googleHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          <GoogleIcon />
          Continue with Google
        </a>
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (codeComplete && !anyPending) void verify(code);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
      </p>
      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              boxRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={anyPending}
            onChange={(event) => handleBoxChange(index, event.target.value)}
            onKeyDown={(event) => handleBoxKeyDown(index, event)}
            onPaste={handlePaste}
            className="h-12 w-full rounded-xl border border-border bg-white text-center text-lg outline-none transition focus:border-primary disabled:opacity-60"
          />
        ))}
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <button type="submit" disabled={!codeComplete || anyPending} className={primaryButtonClass}>
        {isVerifying ? "Verifying…" : "Verify & sign in"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Change email
        </button>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resendSecondsLeft > 0 || anyPending}
          className="text-primary hover:text-primary-hover disabled:text-muted-foreground"
        >
          {resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
