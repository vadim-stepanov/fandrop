import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/_shell/admin/$slug")({
  beforeLoad: ({ params }) => {
    const admin = useAuthStore.getState().admin;
    if (!admin) {
      throw redirect({ to: "/login" });
    }
    // Admin data is scoped by session, not by URL — keep the URL honest:
    // a foreign/typo slug redirects to the admin's own artist.
    if (params.slug !== admin.artist.slug) {
      throw redirect({ to: "/admin/$slug", params: { slug: admin.artist.slug } });
    }
  },
  component: () => <Outlet />,
});
