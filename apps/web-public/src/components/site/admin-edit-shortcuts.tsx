import { LayoutGrid, Pencil } from "lucide-react";
import Link from "next/link";

// Admin-only shortcuts from the public page into web-admin (desktop-only —
// `hidden md:inline-flex`). Native `title` tooltip (no shadcn dep in web-public).

export function AdminEditSectionLink({
  href,
  label,
  tone = "default",
}: {
  href: string;
  label: string;
  // `on-dark` for light-on-dark surfaces (the promo hero overlay).
  tone?: "default" | "on-dark";
}) {
  const toneClass =
    tone === "on-dark"
      ? "text-white/50 hover:text-white"
      : "text-muted-foreground/40 hover:text-foreground";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={`${label} in admin panel`}
      className={`relative -top-0.5 hidden align-middle transition md:inline-flex ${toneClass}`}
    >
      <Pencil className="size-3.5" aria-hidden />
    </Link>
  );
}

export function AdminEditPageFab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Opens this page in the admin panel"
      className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 font-heading text-sm font-semibold text-white opacity-60 shadow-lg transition hover:bg-zinc-800 hover:opacity-100 md:inline-flex"
    >
      <LayoutGrid className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
