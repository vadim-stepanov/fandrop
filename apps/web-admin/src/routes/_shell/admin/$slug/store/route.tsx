import { Outlet, createFileRoute } from "@tanstack/react-router";

// Layout for /admin/<slug>/store — renders the catalog (index) or the
// per-item editor page (new / <itemId>) via the Outlet.
export const Route = createFileRoute("/_shell/admin/$slug/store")({
  component: () => <Outlet />,
});
