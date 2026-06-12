import { Injectable, NotFoundException } from "@nestjs/common";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { PrismaService } from "../../common/prisma/prisma.service";
import { UploadsService } from "../../common/uploads/uploads.service";
import { AuditService } from "../audit/audit.service";
import { CreateQuestDto } from "./dto/create-quest.dto";
import { QuestResponseDto } from "./dto/quest.dto";
import { UpdateQuestDto } from "./dto/update-quest.dto";

const questSelect = {
  id: true,
  title: true,
  description: true,
  link: true,
  imageUrl: true,
  rewardPoints: true,
  availableAt: true,
  featuredPos: true,
  isVisible: true,
} as const satisfies Prisma.ArtistQuestSelect;

@Injectable()
export class QuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService,
  ) {}

  listQuests(artistId: string): Promise<QuestResponseDto[]> {
    return this.prisma.artistQuest.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.QUESTS } },
      orderBy: { createdAt: "desc" },
      select: questSelect,
    });
  }

  async createQuest(
    artistId: string,
    adminUserId: string,
    dto: CreateQuestDto,
  ): Promise<QuestResponseDto> {
    const section = await this.questsSection(artistId);
    const quest = await this.prisma.artistQuest.create({
      data: { ...dto, sectionId: section.id },
      select: questSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_QUEST",
      entityId: quest.id,
      afterPayload: quest,
    });
    return quest;
  }

  async updateQuest(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdateQuestDto,
  ): Promise<QuestResponseDto> {
    const before = await this.ownedQuest(artistId, id);
    const quest = await this.prisma.artistQuest.update({
      where: { id },
      data: { ...dto },
      select: questSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_QUEST",
      entityId: id,
      beforePayload: before,
      afterPayload: quest,
    });
    return quest;
  }

  async deleteQuest(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedQuest(artistId, id);
    await this.prisma.artistQuest.delete({ where: { id } });
    await this.uploads.deleteByUrl(before.imageUrl);
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_QUEST",
      entityId: id,
      beforePayload: before,
    });
  }

  private async questsSection(artistId: string): Promise<{ id: string }> {
    const section = await this.prisma.artistHomeSection.findUnique({
      where: { artistId_key: { artistId, key: ArtistHomeSectionKey.QUESTS } },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException("QUESTS section not found");
    }
    return section;
  }

  private async ownedQuest(artistId: string, id: string): Promise<QuestResponseDto> {
    const owned = await this.prisma.artistQuest.findFirst({
      where: { id, section: { artistId, key: ArtistHomeSectionKey.QUESTS } },
      select: questSelect,
    });
    if (!owned) {
      throw new NotFoundException("Quest not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
