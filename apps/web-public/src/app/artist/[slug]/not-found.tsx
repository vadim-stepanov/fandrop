// Artist-scoped 404 — renders inside the artist shell (navbar + footer) when a
// member-only page (`store`/`profile`/`quests`) calls `notFound()` for an
// anonymous visitor. The navbar logo links back to the artist Home.
export default function ArtistNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-heading text-7xl font-extrabold leading-none text-primary">404</p>
      <h1 className="font-heading text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn’t exist, or it’s only available to members. Use the menu above to head back.
      </p>
    </div>
  );
}
