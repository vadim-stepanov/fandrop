import { Outlet, createFileRoute } from "@tanstack/react-router";

// Layout for /admin/<slug>/home — renders the index (sections table) or a
// child content editor (e.g. /home/rules) via the Outlet.
export const Route = createFileRoute("/_shell/admin/$slug/home")({
  component: () => <Outlet />,
});
