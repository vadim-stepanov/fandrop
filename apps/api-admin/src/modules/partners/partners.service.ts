import { Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UploadsService } from "../../common/uploads/uploads.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { PartnerResponseDto } from "./dto/partner-response.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";

const partnerSelect = {
  id: true,
  name: true,
  logoUrl: true,
  externalUrl: true,
  isVisible: true,
  sortOrder: true,
} as const satisfies Prisma.ArtistPartnerItemSelect;

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService,
  ) {}

  listItems(artistId: string): Promise<PartnerResponseDto[]> {
    return this.prisma.artistPartnerItem.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.PARTNERS } },
      orderBy: { sortOrder: "asc" },
      select: partnerSelect,
    });
  }

  async createItem(
    artistId: string,
    adminUserId: string,
    dto: CreatePartnerDto,
  ): Promise<PartnerResponseDto> {
    const section = await this.partnersSection(artistId);
    const item = await this.prisma.artistPartnerItem.create({
      data: { ...dto, sectionId: section.id },
      select: partnerSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_PARTNER_ITEM",
      entityId: item.id,
      afterPayload: item,
    });
    return item;
  }

  async updateItem(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdatePartnerDto,
  ): Promise<PartnerResponseDto> {
    const before = await this.ownedItem(artistId, id);
    const item = await this.prisma.artistPartnerItem.update({
      where: { id },
      data: { ...dto },
      select: partnerSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_PARTNER_ITEM",
      entityId: id,
      beforePayload: before,
      afterPayload: item,
    });
    return item;
  }

  async deleteItem(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedItem(artistId, id);
    await this.prisma.artistPartnerItem.delete({ where: { id } });
    // Drop the uploaded logo so it doesn't orphan on disk.
    await this.uploads.deleteByUrl(before.logoUrl);
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_PARTNER_ITEM",
      entityId: id,
      beforePayload: before,
    });
  }

  private async partnersSection(artistId: string): Promise<{ id: string }> {
    const section = await this.prisma.artistHomeSection.findUnique({
      where: { artistId_key: { artistId, key: ArtistHomeSectionKey.PARTNERS } },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException("PARTNERS section not found");
    }
    return section;
  }

  // Scope to the admin's artist + return the row as the audit before-snapshot.
  private async ownedItem(artistId: string, id: string): Promise<PartnerResponseDto> {
    const owned = await this.prisma.artistPartnerItem.findFirst({
      where: { id, section: { artistId, key: ArtistHomeSectionKey.PARTNERS } },
      select: partnerSelect,
    });
    if (!owned) {
      throw new NotFoundException("Partner not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
