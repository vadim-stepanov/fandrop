import { useNavigate } from "@tanstack/react-router";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleAdminLoginUrl, requestOtp, verifyOtp } from "@/lib/auth";

const OTP_LENGTH = 6;

export function LoginForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const codeComplete = code.length === OTP_LENGTH && digits.every((d) => d !== "");

  useEffect(() => {
    if (step === "code") {
      boxRefs.current[0]?.focus();
    }
  }, [step]);

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestOtp(email.trim());
      setDigits(Array(OTP_LENGTH).fill(""));
      setStep("code");
    } catch {
      setError("Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(submitted: string) {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(email.trim(), submitted);
      await navigate({ to: "/" });
    } catch {
      setError("Invalid code, or this account is not an artist admin.");
      setDigits(Array(OTP_LENGTH).fill(""));
      boxRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  function fillDigits(next: string[]) {
    setDigits(next);
    if (next.every((d) => d !== "") && !busy) {
      void verify(next.join(""));
    }
  }

  function handleBoxChange(index: number, raw: string) {
    const nextChar = raw.replace(/\D/g, "").slice(-1);
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
    if (pasted.length === 0) {
      return;
    }
    event.preventDefault();
    const next = Array<string>(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    fillDigits(next);
    boxRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  if (step === "email") {
    return (
      <form onSubmit={(e) => void onEmailSubmit(e)} className="space-y-4">
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Sending…" : "Continue with email"}
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <a
          href={googleAdminLoginUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          <GoogleIcon />
          Continue with Google
        </a>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (codeComplete && !busy) {
          void verify(code);
        }
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Code sent to <span className="font-medium text-foreground">{email}</span>
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
            disabled={busy}
            onChange={(e) => handleBoxChange(index, e.target.value)}
            onKeyDown={(e) => handleBoxKeyDown(index, e)}
            onPaste={handlePaste}
            className="h-12 w-full rounded-md border border-input bg-transparent text-center text-lg outline-none transition focus:border-zinc-500 disabled:opacity-60"
          />
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy || !codeComplete} className="w-full">
        {busy ? "Verifying…" : "Verify & sign in"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setError(null);
        }}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        ← Change email
      </button>
    </form>
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
