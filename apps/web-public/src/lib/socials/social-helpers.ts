import type { BrandIconSlug } from "@/components/site/brand-icon";

// Maps a SocialPlatform.slug to a BrandIcon slug. Returns null for unknown slugs
// so consumers render nothing rather than a broken icon.
export function brandSlugFor(platformSlug: string): BrandIconSlug | null {
  switch (platformSlug) {
    case "instagram":
    case "x":
    case "tiktok":
    case "spotify":
    case "apple-music":
    case "youtube":
    case "facebook":
      return platformSlug;
    default:
      return null;
  }
}

// Accepts a handle (`@?[a-zA-Z0-9_.]{1,50}`) or a full http(s) URL. Loose by
// design (URL shapes vary); mirrors the api-public validator.
export function isValidSocialHandleOrUrl(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    return false;
  }
  const handlePattern = /^@?[a-zA-Z0-9_.]{1,50}$/;
  const urlPattern = /^https?:\/\/[\w./?=&%~#:\-+@!$'()*,;]+$/i;
  return handlePattern.test(trimmed) || urlPattern.test(trimmed);
}

// Builds an external profile URL: a raw URL is returned as-is; a handle is mapped
// to the platform's public profile pattern. Unknown platforms fall back to search.
export function externalHref(value: string, platformSlug: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (handle.length === 0) {
    return "#";
  }
  switch (platformSlug) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    case "spotify":
      return `https://open.spotify.com/user/${handle}`;
    case "apple-music":
      return `https://music.apple.com/profile/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${platformSlug} ${handle}`)}`;
  }
}
