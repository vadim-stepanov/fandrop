import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronRight,
  ClipboardList,
  Home,
  LayoutDashboard,
  type LucideIcon,
  Store,
  Target,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { AdminLiveSync } from "@/components/shell/admin-live-sync";
import { ConfirmDialogProvider } from "@/components/feedback/confirm-dialog-provider";
import { AdminUserMenu } from "@/components/shell/user-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <ConfirmDialogProvider>
        <AdminLiveSync />
        <div className="min-h-screen bg-zinc-50">
          <Header />
          <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
            <Sidebar />
            <main className="min-w-0 flex-1">
              <Breadcrumbs />
              {children}
            </main>
          </div>
        </div>
      </ConfirmDialogProvider>
    </TooltipProvider>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="leading-tight">
          <div className="text-xs font-medium text-zinc-500">FanDrop</div>
          <div className="text-base font-semibold tracking-tight text-zinc-900">Admin</div>
        </Link>
        <AdminUserMenu />
      </div>
    </header>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const OVERVIEW: NavItem[] = [{ to: "/admin/$slug", label: "Overview", icon: LayoutDashboard }];
const PAGES: NavItem[] = [
  { to: "/admin/$slug/home", label: "Home", icon: Home },
  { to: "/admin/$slug/store", label: "Store", icon: Store },
  { to: "/admin/$slug/quests", label: "Quests", icon: Target },
  { to: "/admin/$slug/profile", label: "Profile", icon: User },
];
const TOOLS: NavItem[] = [
  { to: "/admin/$slug/users", label: "Users", icon: Users },
  { to: "/admin/$slug/audit", label: "Audit log", icon: ClipboardList },
];

function Sidebar() {
  const slug = useAuthStore((s) => s.admin?.artist.slug);
  if (!slug) {
    return null;
  }
  return (
    <aside className="sticky top-20 hidden h-fit w-56 shrink-0 flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm md:flex">
      <nav className="flex flex-col gap-1">
        {OVERVIEW.map((item) => (
          <NavLink key={item.to} item={item} slug={slug} />
        ))}
      </nav>
      <div>
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Pages
        </p>
        <nav className="flex flex-col gap-1">
          {PAGES.map((item) => (
            <NavLink key={item.to} item={item} slug={slug} />
          ))}
        </nav>
      </div>
      <div>
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Tools
        </p>
        <nav className="flex flex-col gap-1">
          {TOOLS.map((item) => (
            <NavLink key={item.to} item={item} slug={slug} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function NavLink({ item, slug }: { item: NavItem; slug: string }) {
  const { to, label, icon: Icon } = item;
  return (
    <Link
      to={to}
      params={{ slug }}
      activeOptions={{ exact: true }}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900",
        "data-[status=active]:bg-zinc-100 data-[status=active]:font-medium data-[status=active]:text-zinc-900",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

// `to` makes a crumb a link; group labels (e.g. "Pages") and the current
// page have no `to`. Paths under the artist root: /admin/<slug>/<sub...>.
interface Crumb {
  label: string;
  to?: string;
}

const SUB_CRUMBS: Record<string, Crumb[]> = {
  "": [{ label: "Overview" }],
  profile: [{ label: "Pages" }, { label: "Profile" }],
  home: [{ label: "Pages" }, { label: "Home" }],
  "home/rules": [
    { label: "Pages" },
    { label: "Home", to: "/admin/$slug/home" },
    { label: "Rules" },
  ],
  "home/promo": [
    { label: "Pages" },
    { label: "Home", to: "/admin/$slug/home" },
    { label: "Promo" },
  ],
  "home/partners": [
    { label: "Pages" },
    { label: "Home", to: "/admin/$slug/home" },
    { label: "Partners" },
  ],
  "home/store": [
    { label: "Pages" },
    { label: "Home", to: "/admin/$slug/home" },
    { label: "Store" },
  ],
  "home/leaderboard": [
    { label: "Pages" },
    { label: "Home", to: "/admin/$slug/home" },
    { label: "Leaderboard" },
  ],
  store: [{ label: "Pages" }, { label: "Store" }],
  quests: [{ label: "Pages" }, { label: "Quests" }],
  users: [{ label: "Tools" }, { label: "Users" }],
  audit: [{ label: "Tools" }, { label: "Audit log" }],
};

// Promo editor pages (/home/promo/new, /home/promo/<variantId>) share this
// parent trail; the leaf is "New" or "Edit".
const PROMO_PARENT: Crumb[] = [
  { label: "Pages" },
  { label: "Home", to: "/admin/$slug/home" },
  { label: "Promo", to: "/admin/$slug/home/promo" },
];

// Store editor pages (/store/new, /store/<itemId>) share this parent trail;
// the leaf is "New" or "Edit".
const STORE_PARENT: Crumb[] = [{ label: "Pages" }, { label: "Store", to: "/admin/$slug/store" }];

function resolveTrail(sub: string): Crumb[] {
  if (sub === "home/promo/new") {
    return [...PROMO_PARENT, { label: "New" }];
  }
  if (sub.startsWith("home/promo/")) {
    return [...PROMO_PARENT, { label: "Edit" }];
  }
  if (sub === "store/new") {
    return [...STORE_PARENT, { label: "New" }];
  }
  if (sub.startsWith("store/")) {
    return [...STORE_PARENT, { label: "Edit" }];
  }
  return SUB_CRUMBS[sub] ?? [];
}

function Breadcrumbs() {
  const slug = useAuthStore((s) => s.admin?.artist.slug);
  const { pathname } = useLocation();
  const sub = pathname.split("/").slice(3).join("/");
  const trail = resolveTrail(sub);
  if (trail.length === 0 || !slug) {
    return null;
  }
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
      {trail.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-zinc-400" />}
          {crumb.to ? (
            <Link to={crumb.to} params={{ slug }} className="hover:text-zinc-900">
              {crumb.label}
            </Link>
          ) : (
            <span className={i === trail.length - 1 ? "font-medium text-zinc-900" : ""}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
