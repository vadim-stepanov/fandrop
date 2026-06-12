import { Zap } from "lucide-react";
import Image from "next/image";

import type { PublicPromo } from "@/lib/artist";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";
import { toUploadPath } from "@/lib/media";
import { PromoHeroCountdown } from "./promo-hero-countdown";

type Media = { kind: "video"; url: string } | { kind: "image"; url: string };

// Media tier: signed-in viewers get video (else banner); anonymous viewers
// never get video — anon banner, falling back to the shared banner.
function pickMedia(variant: PublicPromo, isAuthenticated: boolean): Media | null {
  if (isAuthenticated) {
    if (variant.videoUrl) return { kind: "video", url: variant.videoUrl };
    if (variant.bannerUrl) return { kind: "image", url: variant.bannerUrl };
    return null;
  }
  if (variant.bannerUrlAnon) return { kind: "image", url: variant.bannerUrlAnon };
  if (variant.bannerUrl) return { kind: "image", url: variant.bannerUrl };
  return null;
}

export function PromoHero({
  variant,
  artistName,
  isAuthenticated,
  editHref,
}: {
  variant: PublicPromo;
  artistName: string;
  isAuthenticated: boolean;
  editHref?: string;
}) {
  const title = variant.title ?? artistName;
  const media = pickMedia(variant, isAuthenticated);

  return (
    // Full-bleed: breaks out to span the viewport (the page container is a plain
    // block, no max-width). Sits flush under the navbar as the first section.
    // Desktop locks to 16:9 (capped); mobile height is content-driven.
    // `overflow-x: clip` on body keeps 100dvw from scrolling.
    <section className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden bg-zinc-800 text-white md:aspect-video md:max-h-[600px]">
      {editHref ? (
        <div className="absolute right-4 top-4 z-20 hidden md:block">
          <AdminEditSectionLink href={editHref} label="Edit Promo" tone="on-dark" />
        </div>
      ) : null}

      {media?.kind === "video" ? (
        <video
          src={media.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover object-center opacity-50 md:opacity-70"
        />
      ) : media?.kind === "image" ? (
        <Image
          src={toUploadPath(media.url)}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50 md:opacity-70"
        />
      ) : null}

      {/* Content spans the hero height and distributes top↔bottom (headline up
          top, countdown + CTA at the bottom) instead of clumping in the centre.
          Mobile: normal flow with py-16. */}
      <div className="relative px-4 py-16 md:absolute md:inset-0 md:px-0 md:py-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-between gap-10 md:px-8 md:py-[5.5rem]">
          <div>
            <h1 className="line-clamp-3 break-words font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              {title}
            </h1>
            {variant.subtitle ? (
              <p className="mt-3 line-clamp-2 max-w-lg break-words text-base font-medium text-white/85 md:mt-4 md:text-lg">
                {variant.subtitle}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-6 md:mb-8">
              <PromoHeroCountdown
                timerEndsAt={variant.timerEndsAt}
                ctaText={variant.ctaText}
                eyebrow={variant.eyebrow}
              />
            </div>
            {variant.ctaLabel ? (
              <a
                href={variant.ctaUrl ?? "#"}
                className="brand-glow inline-flex max-w-full items-center gap-2 rounded-lg bg-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                <Zap className="size-4 shrink-0 fill-primary-foreground" aria-hidden />
                <span className="min-w-0 truncate">{variant.ctaLabel}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
