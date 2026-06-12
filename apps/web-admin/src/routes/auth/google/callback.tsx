import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { completeGoogleLogin } from "@/lib/auth";

// Google redirects here after consent. Exchange the code, then land on the admin
// home (or back to login on failure — e.g. the account isn't an artist admin).
export const Route = createFileRoute("/auth/google/callback")({
  component: GoogleCallback,
});

function GoogleCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      return;
    }
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    void (async () => {
      if (code && state) {
        try {
          await completeGoogleLogin(code, state);
          await navigate({ to: "/" });
          return;
        } catch {
          // Not an admin / exchange failed → fall through to login.
        }
      }
      await navigate({ to: "/login" });
    })();
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </main>
  );
}
