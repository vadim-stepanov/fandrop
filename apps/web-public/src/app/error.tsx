"use client";

// Global error boundary (App Router). Catches render/data errors thrown by any
// route segment so visitors get a recoverable screen instead of a blank page.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-heading text-7xl font-extrabold leading-none text-primary">500</p>
      <h1 className="font-heading text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred while loading this page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
      <p className="mt-4 text-xs text-muted-foreground">Powered by FanDrop</p>
    </main>
  );
}
