import { createFileRoute, redirect } from "@tanstack/react-router";

import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/_shell/")({
  beforeLoad: () => {
    const admin = useAuthStore.getState().admin;
    if (!admin) {
      throw redirect({ to: "/login" });
    }
    // The admin's artist is the only one they manage — send them to its root.
    throw redirect({ to: "/admin/$slug", params: { slug: admin.artist.slug } });
  },
  component: () => null,
});
