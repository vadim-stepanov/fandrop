import { Outlet, createFileRoute } from "@tanstack/react-router";

// Layout for /admin/<slug>/home/promo — renders the list (index) or the
// per-variant editor page (new / <variantId>) via the Outlet.
export const Route = createFileRoute("/_shell/admin/$slug/home/promo")({
  component: () => <Outlet />,
});
