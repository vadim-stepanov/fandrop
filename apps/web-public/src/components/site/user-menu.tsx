"use client";

import { LogOut, User, UserCog } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/app/actions";
import { toUploadPath } from "@/lib/media";

const WEB_ADMIN_URL = process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:5173";

// Signed-in fan's navbar menu. Shows the viewer's avatar (uploaded or from
// Google), an icon fallback otherwise. "Admin" only shows when the viewer is an
// admin of this artist (canOpenAdmin).
export function UserMenu({
  displayName,
  avatarUrl,
  artistSlug,
  canOpenAdmin,
}: {
  displayName: string;
  avatarUrl: string | null;
  artistSlug: string;
  canOpenAdmin: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function onClickAway(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickAway);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClickAway);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[140px] truncate font-heading text-xs font-bold text-navbar-foreground sm:inline">
        {displayName}
      </span>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Open menu for ${displayName}`}
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground transition hover:brightness-95"
        >
          {avatarUrl ? (
            <Image
              src={toUploadPath(avatarUrl)}
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-4" aria-hidden />
          )}
        </button>

        {isOpen && (
          <div
            role="menu"
            // Mobile: right-aligned to the avatar so it stays on-screen near the
            // edge. Desktop: centered under the icon. (Diverges from the
            // reference's `absolute right-0` per Vadim's preference.)
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl md:left-1/2 md:right-auto md:-translate-x-1/2"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
                {avatarUrl ? (
                  <Image
                    src={toUploadPath(avatarUrl)}
                    alt=""
                    width={36}
                    height={36}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            </div>

            <Link
              href={`/artist/${artistSlug}/profile`}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted"
            >
              <User className="size-4 text-muted-foreground" aria-hidden />
              My Profile
            </Link>

            {canOpenAdmin && (
              <a
                href={`${WEB_ADMIN_URL}/admin/${artistSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted"
              >
                <UserCog className="size-4 text-muted-foreground" aria-hidden />
                Admin panel
              </a>
            )}

            <form action={logout.bind(null, artistSlug)} className="border-t border-border">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-muted"
              >
                <LogOut className="size-4 text-muted-foreground" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
