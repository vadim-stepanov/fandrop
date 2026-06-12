import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/login-form";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().status === "authed") {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">FanDrop Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in with your email.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
