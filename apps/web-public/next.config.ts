import type { NextConfig } from "next";

// Both backends serve uploaded media via ServeStaticModule at /uploads, split
// by subdir: api-public owns user avatars, api-admin owns admin-curated media
// (logos, store/quest images, promo banners, partner logos). Hardcoded hosts
// are fine for this local-only project (cf. the API_PUBLIC_URL fallback in
// lib/api.ts).
const PUBLIC_ORIGIN = "http://localhost:3001"; // avatars
const ADMIN_ORIGIN = "http://localhost:3002"; // admin media

const nextConfig: NextConfig = {
  images: {
    // Uploaded media is proxied same-origin (rewrite below) and referenced by
    // relative /uploads/... paths, so next/image treats it as a *local* image
    // (localPatterns) — sidestepping the optimizer's private-IP (localhost)
    // SSRF block. Google sign-in avatars are a genuine remote host.
    localPatterns: [{ pathname: "/uploads/**" }],
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  // Serve the static marketing landing (public/landing.html) at `/`.
  // beforeFiles runs ahead of app routes, so `/` maps to the standalone HTML.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/landing.html" },
        // Proxy uploaded media through this origin so the browser and the
        // next/image optimizer see first-party /uploads/... URLs. Avatars are
        // served by api-public, the rest by api-admin — the specific avatars
        // rule must precede the catch-all.
        {
          source: "/uploads/avatars/:path*",
          destination: `${PUBLIC_ORIGIN}/uploads/avatars/:path*`,
        },
        { source: "/uploads/:path*", destination: `${ADMIN_ORIGIN}/uploads/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
