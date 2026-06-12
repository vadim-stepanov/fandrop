// Global 404 (App Router). Renders for unknown routes and for `notFound()`
// thrown above the artist layout (e.g. an artist slug that doesn't exist).
// Member-only pages 404 within their artist shell — see artist/[slug]/not-found.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-heading text-7xl font-extrabold leading-none text-primary">404</p>
      <h1 className="font-heading text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn’t exist, or it’s only available to members.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">Powered by FanDrop</p>
    </main>
  );
}
