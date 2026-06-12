import { Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UploadsService } from "../../common/uploads/uploads.service";
import { CreateStoreItemDto } from "./dto/create-store-item.dto";
import { StoreItemResponseDto } from "./dto/store-item.dto";
import { UpdateStoreItemDto } from "./dto/update-store-item.dto";

const storeSelect = {
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
  featuredPos: true,
  isVisible: true,
} as const satisfies Prisma.ArtistStoreItemSelect;

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService,
  ) {}

  listItems(artistId: string): Promise<StoreItemResponseDto[]> {
    return this.prisma.artistStoreItem.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.STORE } },
      orderBy: { createdAt: "desc" },
      select: storeSelect,
    });
  }

  async createItem(
    artistId: string,
    adminUserId: string,
    dto: CreateStoreItemDto,
  ): Promise<StoreItemResponseDto> {
    const section = await this.storeSection(artistId);
    const item = await this.prisma.artistStoreItem.create({
      data: { ...dto, sectionId: section.id },
      select: storeSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_STORE_ITEM",
      entityId: item.id,
      afterPayload: item,
    });
    return item;
  }

  async updateItem(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdateStoreItemDto,
  ): Promise<StoreItemResponseDto> {
    const before = await this.ownedItem(artistId, id);
    const item = await this.prisma.artistStoreItem.update({
      where: { id },
      data: { ...dto },
      select: storeSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_STORE_ITEM",
      entityId: id,
      beforePayload: before,
      afterPayload: item,
    });
    return item;
  }

  async deleteItem(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedItem(artistId, id);
    await this.prisma.artistStoreItem.delete({ where: { id } });
    await this.uploads.deleteByUrl(before.imageUrl);
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_STORE_ITEM",
      entityId: id,
      beforePayload: before,
    });
  }

  private async storeSection(artistId: string): Promise<{ id: string }> {
    const section = await this.prisma.artistHomeSection.findUnique({
      where: { artistId_key: { artistId, key: ArtistHomeSectionKey.STORE } },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException("STORE section not found");
    }
    return section;
  }

  private async ownedItem(artistId: string, id: string): Promise<StoreItemResponseDto> {
    const owned = await this.prisma.artistStoreItem.findFirst({
      where: { id, section: { artistId, key: ArtistHomeSectionKey.STORE } },
      select: storeSelect,
    });
    if (!owned) {
      throw new NotFoundException("Store item not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
