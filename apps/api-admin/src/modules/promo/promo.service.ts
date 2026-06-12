import { Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UploadsService } from "../../common/uploads/uploads.service";
import { CreatePromoDto } from "./dto/create-promo.dto";
import { PromoResponseDto } from "./dto/promo.dto";
import { UpdatePromoDto } from "./dto/update-promo.dto";

const promoSelect = {
  id: true,
  name: true,
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
  isActive: true,
} as const satisfies Prisma.ArtistPromoVariantSelect;

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService,
  ) {}

  listVariants(artistId: string): Promise<PromoResponseDto[]> {
    return this.prisma.artistPromoVariant.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.PROMO } },
      orderBy: { createdAt: "desc" },
      select: promoSelect,
    });
  }

  async createVariant(
    artistId: string,
    adminUserId: string,
    dto: CreatePromoDto,
  ): Promise<PromoResponseDto> {
    const section = await this.promoSection(artistId);
    const variant = await this.prisma.artistPromoVariant.create({
      data: { ...dto, sectionId: section.id },
      select: promoSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_PROMO_VARIANT",
      entityId: variant.id,
      afterPayload: variant,
    });
    return variant;
  }

  async updateVariant(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdatePromoDto,
  ): Promise<PromoResponseDto> {
    const before = await this.ownedVariant(artistId, id);
    const variant = await this.prisma.artistPromoVariant.update({
      where: { id },
      data: { ...dto },
      select: promoSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_PROMO_VARIANT",
      entityId: id,
      beforePayload: before,
      afterPayload: variant,
    });
    return variant;
  }

  async deleteVariant(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedVariant(artistId, id);
    await this.prisma.artistPromoVariant.delete({ where: { id } });
    // Drop the variant's uploaded media so it doesn't orphan on disk.
    await this.uploads.deleteManyByUrl([before.bannerUrl, before.videoUrl, before.bannerUrlAnon]);
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_PROMO_VARIANT",
      entityId: id,
      beforePayload: before,
    });
  }

  // Make one variant active; only one active per PROMO section (transaction).
  async setActive(artistId: string, adminUserId: string, id: string): Promise<PromoResponseDto> {
    const section = await this.promoSection(artistId);
    const owned = await this.prisma.artistPromoVariant.findFirst({
      where: { id, sectionId: section.id },
      select: { id: true },
    });
    if (!owned) {
      throw new NotFoundException("Promo variant not found");
    }
    const variant = await this.prisma.$transaction(async (tx) => {
      await tx.artistPromoVariant.updateMany({
        where: { sectionId: section.id },
        data: { isActive: false },
      });
      return tx.artistPromoVariant.update({
        where: { id },
        data: { isActive: true },
        select: promoSelect,
      });
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_PROMO_VARIANT",
      entityId: id,
      afterPayload: variant,
      reason: "Set active",
    });
    return variant;
  }

  private async promoSection(artistId: string): Promise<{ id: string }> {
    const section = await this.prisma.artistHomeSection.findUnique({
      where: { artistId_key: { artistId, key: ArtistHomeSectionKey.PROMO } },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException("PROMO section not found");
    }
    return section;
  }

  private async ownedVariant(artistId: string, id: string): Promise<PromoResponseDto> {
    const owned = await this.prisma.artistPromoVariant.findFirst({
      where: { id, section: { artistId, key: ArtistHomeSectionKey.PROMO } },
      select: promoSelect,
    });
    if (!owned) {
      throw new NotFoundException("Promo variant not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
