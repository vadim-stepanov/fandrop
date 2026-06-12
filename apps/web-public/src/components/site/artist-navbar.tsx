"use client";

import { Home, Music, Store as StoreIcon, Target, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SigninButton } from "@/components/auth/signin-button";
import { BalanceWidget } from "@/components/site/balance-widget";
import { UserMenu } from "@/components/site/user-menu";
import { toUploadPath } from "@/lib/media";

type ArtistNavbarProps = {
  artistSlug: string;
  artistName: string;
  artistLogoUrl: string | null;
  pointsBalance: number | null;
  isSignedIn: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  canOpenAdmin: boolean;
  // Count of COMPLETED-but-unclaimed quests → gold badge on the Store link.
  unclaimedQuests: number;
  // While the onboarding modal is open it emits its own orbs from the modal
  // icon → the widget skips its internal orb cloud (only pulse + counter roll).
  suppressBalanceOrbs?: boolean;
};

export function ArtistNavbar({
  artistSlug,
  artistName,
  artistLogoUrl,
  pointsBalance,
  isSignedIn,
  displayName,
  avatarUrl,
  canOpenAdmin,
  unclaimedQuests,
  suppressBalanceOrbs = false,
}: ArtistNavbarProps) {
  const pathname = usePathname();
  const homeHref = `/artist/${artistSlug}`;

  const navItems = [
    { label: "Home", href: homeHref, icon: Home, badge: 0 },
    { label: "Store", href: `${homeHref}/store`, icon: StoreIcon, badge: 0 },
    { label: "Quests", href: `${homeHref}/quests`, icon: Target, badge: unclaimedQuests },
    { label: "Profile", href: `${homeHref}/profile`, icon: UserIcon, badge: 0 },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-navbar text-navbar-foreground">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={homeHref}
          aria-label={artistName}
          className="flex min-w-0 shrink items-center gap-3"
        >
          {artistLogoUrl ? (
            <Image
              src={toUploadPath(artistLogoUrl)}
              alt={artistName}
              width={64}
              height={64}
              sizes="64px"
              // Above the fold on every artist page (the only LCP candidate on
              // pages without a promo hero) — eager + preload.
              priority
              className="h-16 w-auto max-w-48 shrink-0 object-contain"
            />
          ) : (
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed border-navbar-foreground/30 text-navbar-foreground/50"
              title={`${artistName} (no logo uploaded)`}
            >
              <Music className="size-7" aria-hidden />
            </span>
          )}
          <span className="truncate text-lg font-semibold">{artistName}</span>
        </Link>

        {/* Member-only pages (Store/Profile) are hidden from anonymous viewers —
            only Home is public. */}
        <div className="hidden items-center gap-6 md:flex">
          {isSignedIn &&
            navItems.map(({ label, href, icon: Icon, badge }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-primary"
                      : "text-navbar-foreground/80 hover:text-navbar-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                  {badge > 0 ? (
                    <span className="absolute -right-3.5 -top-3 grid min-w-[18px] place-items-center rounded-full bg-points px-1 text-[11px] font-extrabold leading-[18px] text-black">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
        </div>

        {/* Balance widget is absolute-positioned to the left of this group so its
            width changes (counter roll 0→1,234) + pulse scale don't trigger flex
            re-layout — which would shift the centre nav-links via justify-between. */}
        <div className="relative flex shrink-0 items-center gap-3">
          {pointsBalance !== null && (
            <div className="absolute right-full top-1/2 mr-3 -translate-y-1/2">
              <BalanceWidget
                pointsBalance={pointsBalance}
                suppressInternalOrbs={suppressBalanceOrbs}
              />
            </div>
          )}
          {isSignedIn && displayName ? (
            <UserMenu
              displayName={displayName}
              avatarUrl={avatarUrl}
              artistSlug={artistSlug}
              canOpenAdmin={canOpenAdmin}
            />
          ) : (
            <SigninButton className="rounded-xl border border-navbar-foreground/30 px-4 py-2 text-sm font-medium text-navbar-foreground transition hover:bg-navbar-foreground/10" />
          )}
        </div>
      </div>
    </nav>
  );
}
