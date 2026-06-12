/**
 * Renders an officially-branded icon from `public/brand-icons/<slug>.svg`.
 * Slugs match `SocialPlatform.slug` for socials and OAuth provider names for auth
 * surfaces. Icons are full-color brand marks (fills baked into the SVG, so they
 * ignore CSS `color`). Plain `<img>` — SVGs aren't optimized by next/image and
 * are tiny.
 */
export type BrandIconSlug =
  | "google"
  | "apple"
  | "facebook"
  | "instagram"
  | "x"
  | "tiktok"
  | "spotify"
  | "apple-music"
  | "youtube";

const LABELS: Record<BrandIconSlug, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  spotify: "Spotify",
  "apple-music": "Apple Music",
  youtube: "YouTube",
};

// Per-slug optical correction — brand SVGs have very different internal padding,
// so without this X/TikTok look oversized next to Instagram/Spotify at the same
// box size. Scales picked by eye.
const OPTICAL_SCALE: Partial<Record<BrandIconSlug, string>> = {
  x: "scale-[0.8]",
  tiktok: "scale-[0.8]",
  apple: "scale-[0.92]",
  google: "scale-[0.95]",
};

export function BrandIcon({
  slug,
  alt,
  className,
}: {
  slug: BrandIconSlug;
  alt?: string;
  className?: string;
}) {
  const scale = OPTICAL_SCALE[slug] ?? "";
  const composed = ["object-contain", scale, className ?? ""].filter(Boolean).join(" ");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand-icons/${slug}.svg`}
      alt={alt ?? LABELS[slug]}
      className={composed}
      loading="lazy"
      decoding="async"
    />
  );
}
