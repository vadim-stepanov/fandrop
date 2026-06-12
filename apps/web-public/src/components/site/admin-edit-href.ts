// Cross-app links from the public page into the separate web-admin SPA. Plain TS
// (no "use client") so both server components (computing hrefs) and the client
// shortcut components can import it.
const WEB_ADMIN_URL = process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:5173";

// Section key → its admin editor route fragment. Keys without an entry return
// null so we never render a broken pencil.
const SECTION_EDIT_SEG: Partial<Record<string, string>> = {
  PROMO: "home/promo",
  RULES: "home/rules",
  PARTNERS: "home/partners",
  STORE: "home/store",
  LEADERBOARD: "home/leaderboard",
};

export function buildSectionEditHref(slug: string, key: string): string | null {
  const seg = SECTION_EDIT_SEG[key];
  return seg ? `${WEB_ADMIN_URL}/admin/${slug}/${seg}` : null;
}

export function buildPageEditHref(slug: string, page: "home" = "home"): string {
  return `${WEB_ADMIN_URL}/admin/${slug}/${page}`;
}

// The admin Profile page hosts the referral-program settings (reward + toggle).
export function buildProfileEditHref(slug: string): string {
  return `${WEB_ADMIN_URL}/admin/${slug}/profile`;
}
