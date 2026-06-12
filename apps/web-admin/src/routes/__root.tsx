import { Outlet, createRootRoute } from "@tanstack/react-router";

// Branded 404 for unknown admin routes. Neutral theme (admin is B/W). Plain
// anchor to "/" so it doesn't depend on the typed route tree.
function AdminNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-7xl font-extrabold leading-none text-zinc-900">404</p>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">This admin page doesn’t exist.</p>
      <a
        href="/"
        className="mt-2 inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Back to admin
      </a>
    </div>
  );
}

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: AdminNotFound,
});
