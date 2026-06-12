import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ArtistHomeSectionKey, type QuestStatus } from "@fandrop/db";
import { ARTIST_ACTIVITY } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { PrismaService } from "../../common/prisma/prisma.service";
import {
  PublicQuestResponseDto,
  QuestActionResultResponseDto,
  QuestClaimResultResponseDto,
} from "./dto/public-quest.dto";

const FEATURED_SIZE = 4;

const questPublicSelect = {
  id: true,
  title: true,
  description: true,
  link: true,
  imageUrl: true,
  rewardPoints: true,
  availableAt: true,
} as const;

type QuestRow = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  imageUrl: string | null;
  rewardPoints: number;
  availableAt: Date | null;
  userQuests: { status: QuestStatus }[];
};

function toView({ userQuests, ...quest }: QuestRow): PublicQuestResponseDto {
  return { ...quest, status: userQuests[0]?.status ?? "NOT_STARTED" };
}

@Injectable()
export class QuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  // Full member-only list (Quests is member-only — same gate as Store).
  async listQuests(userId: string, slug: string): Promise<PublicQuestResponseDto[]> {
    const { artistUserId } = await this.memberOrThrow(userId, slug);
    const quests = await this.prisma.artistQuest.findMany({
      where: { isVisible: true, section: { artist: { slug }, key: ArtistHomeSectionKey.QUESTS } },
      orderBy: { createdAt: "desc" },
      select: {
        ...questPublicSelect,
        userQuests: { where: { artistUserId }, select: { status: true } },
      },
    });
    return quests.map(toView);
  }

  // Home teaser: featured quests, only if the QUESTS section is visible. Authed
  // viewers get their status and don't see quests they've already claimed.
  async getFeatured(slug: string, userId?: string): Promise<PublicQuestResponseDto[]> {
    const artistUserId = userId ? await this.memberId(userId, slug) : null;
    const quests = await this.prisma.artistQuest.findMany({
      where: {
        isVisible: true,
        featuredPos: { gt: 0 },
        section: { artist: { slug }, key: ArtistHomeSectionKey.QUESTS, isVisible: true },
      },
      orderBy: { featuredPos: "asc" },
      select: {
        ...questPublicSelect,
        // Empty match for anon → no status rows → NOT_STARTED.
        userQuests: { where: { artistUserId: artistUserId ?? "" }, select: { status: true } },
      },
    });
    return quests
      .map(toView)
      .filter((quest) => quest.status !== "CLAIMED")
      .slice(0, FEATURED_SIZE);
  }

  // Start = open the link → instantly COMPLETED (no verification). Idempotent.
  async start(
    userId: string,
    slug: string,
    questId: string,
  ): Promise<QuestActionResultResponseDto> {
    const { artistUserId } = await this.memberOrThrow(userId, slug);
    const quest = await this.prisma.artistQuest.findFirst({
      where: {
        id: questId,
        isVisible: true,
        section: { artist: { slug }, key: ArtistHomeSectionKey.QUESTS },
      },
      select: { availableAt: true },
    });
    if (!quest) {
      throw new NotFoundException("Quest not found");
    }
    if (quest.availableAt && quest.availableAt.getTime() > Date.now()) {
      throw new ForbiddenException("Quest is not available yet");
    }
    const existing = await this.prisma.artistUserQuest.findUnique({
      where: { artistUserId_questId: { artistUserId, questId } },
      select: { status: true },
    });
    if (existing && (existing.status === "COMPLETED" || existing.status === "CLAIMED")) {
      return { status: existing.status };
    }
    const now = new Date();
    const row = await this.prisma.artistUserQuest.upsert({
      where: { artistUserId_questId: { artistUserId, questId } },
      create: { artistUserId, questId, status: "COMPLETED", startedAt: now, completedAt: now },
      update: { status: "COMPLETED", completedAt: now },
      select: { status: true },
    });
    return { status: row.status };
  }

  // Claim = credit reward points once (manual). Idempotent via the COMPLETED→
  // CLAIMED transition guarded inside the transaction.
  async claim(userId: string, slug: string, questId: string): Promise<QuestClaimResultResponseDto> {
    const { artistUserId, artistId } = await this.memberOrThrow(userId, slug);
    const result = await this.prisma.$transaction(
      async (tx): Promise<QuestClaimResultResponseDto> => {
        const userQuest = await tx.artistUserQuest.findUnique({
          where: { artistUserId_questId: { artistUserId, questId } },
          select: {
            id: true,
            status: true,
            quest: { select: { rewardPoints: true, title: true } },
          },
        });
        if (!userQuest || userQuest.status !== "COMPLETED") {
          return { claimed: false, amount: 0 };
        }
        const amount = Math.max(0, userQuest.quest.rewardPoints);
        if (amount > 0) {
          await tx.artistPointsTransaction.create({
            data: {
              artistUserId,
              amount,
              kind: "QUEST_REWARD",
              description: `Quest reward: ${userQuest.quest.title}`,
            },
          });
        }
        await tx.artistUserQuest.update({
          where: { id: userQuest.id },
          data: { status: "CLAIMED", claimedAt: new Date() },
        });
        return { claimed: true, amount };
      },
    );

    if (result.claimed) {
      await this.bus.publish(ARTIST_ACTIVITY, { artistId, userId, kind: "quest-claim" });
    }
    return result;
  }

  // Count of the viewer's COMPLETED-but-unclaimed quests (drives the navbar
  // badge). 0 for anon / non-member.
  async unclaimedCount(userId: string, slug: string): Promise<number> {
    const artistUserId = await this.memberId(userId, slug);
    if (!artistUserId) {
      return 0;
    }
    return this.prisma.artistUserQuest.count({ where: { artistUserId, status: "COMPLETED" } });
  }

  private async memberOrThrow(
    userId: string,
    slug: string,
  ): Promise<{ artistUserId: string; artistId: string }> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true, artistId: true },
    });
    if (!member) {
      throw new ForbiddenException("Not a member of this artist");
    }
    return { artistUserId: member.id, artistId: member.artistId };
  }

  private async memberId(userId: string, slug: string): Promise<string | null> {
    const member = await this.prisma.artistUser.findFirst({
      where: { userId, artist: { slug } },
      select: { id: true },
    });
    return member?.id ?? null;
  }
}
