import Image from "next/image";

import type { PublicPartner } from "@/lib/artist";
import { AdminEditSectionLink } from "@/components/site/admin-edit-shortcuts";
import { toUploadPath } from "@/lib/media";

// Enough cards per copy that the duplicated 2-copy track spans beyond any
// viewport — otherwise the translateX(-50%) loop exposes a gap on short lists.
const MIN_CARDS_PER_COPY = 15;
// At this many partners the marquee splits into two rows.
const TWO_ROW_THRESHOLD = 5;

function PartnerCard({ partner }: { partner: PublicPartner }) {
  const inner = partner.logoUrl ? (
    <span className="relative block size-full">
      <Image
        src={toUploadPath(partner.logoUrl)}
        alt={partner.name}
        fill
        sizes="(max-width: 768px) 128px, 300px"
        className="object-contain"
      />
    </span>
  ) : (
    <span className="line-clamp-1 break-words font-heading text-xs font-semibold text-muted-foreground">
      {partner.name}
    </span>
  );

  const classes =
    "mx-2 inline-flex h-16 w-32 items-center justify-center rounded-lg border border-border bg-card p-5 align-middle opacity-40 grayscale transition hover:opacity-60 hover:grayscale-0 md:h-[106px] md:w-[300px] md:p-8";

  return partner.externalUrl ? (
    <a
      href={partner.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={partner.name}
    >
      {inner}
    </a>
  ) : (
    <div className={classes} role="img" aria-label={partner.name}>
      {inner}
    </div>
  );
}

// One infinite-scroll row. Repeats the slice so the -50% loop is seamless even
// for short lists, and scales duration with track length for constant speed.
function MarqueeRow({
  partners,
  secondsPerCard,
}: {
  partners: PublicPartner[];
  secondsPerCard: number;
}) {
  const timesToRepeat = Math.max(1, Math.ceil(MIN_CARDS_PER_COPY / partners.length));
  const singleCopy = Array.from({ length: timesToRepeat }, () => partners).flat();
  const track = [...singleCopy, ...singleCopy];

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div
        className="inline-block animate-marquee"
        style={{ animationDuration: `${track.length * secondsPerCard}s` }}
      >
        {track.map((item, i) => (
          <PartnerCard key={`${item.name}-${i}`} partner={item} />
        ))}
      </div>
    </div>
  );
}

// Full-bleed marquee of partner logos. 5+ partners → two desync'd rows.
export function PartnersMarquee({
  title,
  subtitle,
  editHref,
  items,
}: {
  title: string;
  subtitle: string | null;
  editHref?: string;
  items: PublicPartner[];
}) {
  if (items.length === 0) {
    return null;
  }

  const twoRows = items.length >= TWO_ROW_THRESHOLD;
  const splitAt = Math.floor(items.length / 2);
  const topRow = twoRows ? items.slice(0, splitAt) : items;
  const bottomRow = twoRows ? items.slice(splitAt) : [];

  return (
    <section className="relative left-1/2 w-[100dvw] -translate-x-1/2 py-7 md:py-14">
      <div className="mx-auto mb-8 max-w-3xl px-4 text-center">
        <h2 className="line-clamp-1 break-words font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          {title}
          {editHref ? (
            <span className="ml-2 align-middle">
              <AdminEditSectionLink href={editHref} label={`Edit ${title}`} />
            </span>
          ) : null}
        </h2>
        {subtitle ? (
          <p className="mt-2 line-clamp-1 break-words text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="space-y-3 md:space-y-4">
        {/* Bottom row ~20% slower so the rows visibly desync. */}
        <MarqueeRow partners={topRow} secondsPerCard={2} />
        {twoRows ? <MarqueeRow partners={bottomRow} secondsPerCard={2.4} /> : null}
      </div>
    </section>
  );
}
