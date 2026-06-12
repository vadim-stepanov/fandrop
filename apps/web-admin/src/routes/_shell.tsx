import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/shell/admin-shell";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/_shell")({
  beforeLoad: () => {
    if (useAuthStore.getState().status !== "authed") {
      throw redirect({ to: "/login" });
    }
  },
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
