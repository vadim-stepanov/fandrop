"use client";

import { Home, Store as StoreIcon, Target, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile-only bottom navigation (the navbar's links are hidden on mobile).
export function ArtistBottomTabBar({ artistSlug }: { artistSlug: string }) {
  const pathname = usePathname();
  const homeHref = `/artist/${artistSlug}`;

  const tabs = [
    { label: "Home", icon: Home, href: homeHref },
    { label: "Store", icon: StoreIcon, href: `${homeHref}/store` },
    { label: "Quests", icon: Target, href: `${homeHref}/quests` },
    { label: "Profile", icon: UserIcon, href: `${homeHref}/profile` },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-navbar-foreground/10 bg-navbar text-navbar-foreground md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-primary" : "text-navbar-foreground/60"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
