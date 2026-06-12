import { Injectable, NotFoundException } from "@nestjs/common";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";

import { PrismaService } from "../../common/prisma/prisma.service";
import { PublicArtistHomeResponseDto } from "./dto/public-artist-home.dto";
import { PublicPartnerResponseDto } from "./dto/public-partner.dto";
import { PublicPromoResponseDto } from "./dto/public-promo.dto";
import { PublicRuleResponseDto } from "./dto/public-rule.dto";
import { PublicStoreItemResponseDto } from "./dto/public-store-item.dto";

const rulePublicSelect = { title: true, body: true } as const satisfies Prisma.ArtistRuleItemSelect;

const partnerPublicSelect = {
  name: true,
  logoUrl: true,
  externalUrl: true,
} as const satisfies Prisma.ArtistPartnerItemSelect;

const promoPublicSelect = {
  title: true,
  subtitle: true,
  ctaLabel: true,
  ctaUrl: true,
  ctaText: true,
  bannerUrl: true,
  videoUrl: true,
  bannerUrlAnon: true,
  eyebrow: true,
  timerEndsAt: true,
} as const satisfies Prisma.ArtistPromoVariantSelect;

const storePublicSelect = {
  id: true,
  title: true,
  imageUrl: true,
  category: true,
  quality: true,
  priceMode: true,
  priceAmountCents: true,
  currencyCode: true,
  pointsPrice: true,
  loyaltyPoints: true,
  stockCount: true,
  leftAlert: true,
  salesStartAt: true,
} as const satisfies Prisma.ArtistStoreItemSelect;

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicHome(slug: string): Promise<PublicArtistHomeResponseDto> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        // Public so the anonymous auth modal can show an optional referral-code
        // field (only when the artist runs a program with a positive reward).
        referralEnabled: true,
        referralRewardPoints: true,
        homeSections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          select: { key: true, title: true, subtitle: true },
        },
      },
    });
    if (!artist) {
      throw new NotFoundException("Artist not found");
    }
    const { homeSections, ...rest } = artist;
    return { ...rest, sections: homeSections };
  }

  // Rule items of the artist's RULES section, only if the section is visible.
  getRules(slug: string): Promise<PublicRuleResponseDto[]> {
    return this.prisma.artistRuleItem.findMany({
      where: {
        isVisible: true,
        section: { artist: { slug }, key: ArtistHomeSectionKey.RULES, isVisible: true },
      },
      orderBy: { stepNumber: "asc" },
      select: rulePublicSelect,
    });
  }

  // Visible partner items of the artist's PARTNERS section, only if the section
  // itself is visible. Ordered by sortOrder.
  getPartners(slug: string): Promise<PublicPartnerResponseDto[]> {
    return this.prisma.artistPartnerItem.findMany({
      where: {
        isVisible: true,
        section: { artist: { slug }, key: ArtistHomeSectionKey.PARTNERS, isVisible: true },
      },
      orderBy: { sortOrder: "asc" },
      select: partnerPublicSelect,
    });
  }

  // The active variant of the artist's PROMO section, only if visible. Null
  // when no section / not visible / no active variant. The viewer's media tier
  // (video vs anon banner) is decided on the render side.
  getActivePromo(slug: string): Promise<PublicPromoResponseDto | null> {
    return this.prisma.artistPromoVariant.findFirst({
      where: {
        isActive: true,
        section: { artist: { slug }, key: ArtistHomeSectionKey.PROMO, isVisible: true },
      },
      select: promoPublicSelect,
    });
  }

  // The signed-in viewer's effective avatar (uploaded, else Google). Global on
  // User — slug is only the auth context.
  async getMyAvatar(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, googleAvatarUrl: true },
    });
    return user?.avatarUrl ?? user?.googleAvatarUrl ?? null;
  }

  // All visible items of the artist's STORE section (the Store page). The store
  // page is its own route, so it does not require the STORE Home-section to be
  // visible. Client decides the display order (user-selectable); default newest.
  getStore(slug: string): Promise<PublicStoreItemResponseDto[]> {
    return this.prisma.artistStoreItem.findMany({
      where: { isVisible: true, section: { artist: { slug }, key: ArtistHomeSectionKey.STORE } },
      orderBy: { createdAt: "desc" },
      select: storePublicSelect,
    });
  }

  // Top-N featured items for the Store block on Home (featuredPos > 0), only if
  // the STORE section itself is visible. Ordered by featuredPos.
  getStoreFeatured(slug: string, limit: number): Promise<PublicStoreItemResponseDto[]> {
    return this.prisma.artistStoreItem.findMany({
      where: {
        isVisible: true,
        featuredPos: { gt: 0 },
        section: { artist: { slug }, key: ArtistHomeSectionKey.STORE, isVisible: true },
      },
      orderBy: { featuredPos: "asc" },
      take: limit,
      select: storePublicSelect,
    });
  }

  // Whether the viewer is an admin of this artist — drives the public-page
  // admin-jump (Admin menu item + edit pencils/FAB). Mirrors api-admin's guard.
  async canManageArtist(userId: string, slug: string): Promise<boolean> {
    const membership = await this.prisma.artistUser.findFirst({
      where: { userId, role: "ARTIST_ADMIN", artist: { slug } },
      select: { id: true },
    });
    return membership !== null;
  }
}
