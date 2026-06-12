import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";

// Admin header account menu — avatar (initial) + dropdown with identity + sign out.
// Mirrors the public user-menu, on the neutral admin theme.
export function AdminUserMenu() {
  const admin = useAuthStore((s) => s.admin);
  const navigate = useNavigate();

  if (!admin) {
    return null;
  }

  const email = admin.user.email;
  const name = email.split("@")[0] || email;
  const initial = (email[0] ?? "?").toUpperCase();
  const avatarUrl = admin.user.avatarUrl;

  async function handleLogout() {
    await logout();
    await navigate({ to: "/login" });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Name sits beside the avatar (like the public widget); only the avatar
          is the trigger, and the menu opens centered under it. */}
      <span className="hidden max-w-[160px] truncate text-sm text-zinc-600 sm:inline">{name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initial
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-60">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-sm font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{email}</p>
              <p className="truncate text-xs text-muted-foreground">{admin.artist.name} · Admin</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleLogout()}>
            <LogOut aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
