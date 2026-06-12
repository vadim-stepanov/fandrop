import { Controller, Get, Param, Post, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/auth/optional-jwt-auth.guard";
import { OptionalUser } from "../../common/auth/optional-user.decorator";
import {
  PublicQuestResponseDto,
  QuestActionResultResponseDto,
  QuestClaimResultResponseDto,
  QuestUnclaimedResponseDto,
} from "./dto/public-quest.dto";
import { QuestsService } from "./quests.service";

@Controller("artists")
export class QuestsController {
  constructor(private readonly quests: QuestsService) {}

  // Full quest list — member-only (Quests can hold sensitive offers; anons/
  // crawlers must not see it). The Home teaser uses /quests/featured below.
  @Get(":slug/quests")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PublicQuestResponseDto, isArray: true })
  @SerializeOptions({ type: PublicQuestResponseDto, excludeExtraneousValues: true })
  listQuests(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<PublicQuestResponseDto[]> {
    return this.quests.listQuests(userId, slug);
  }

  // Count of the viewer's unclaimed quest rewards (navbar badge).
  @Get(":slug/me/quests-unclaimed")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: QuestUnclaimedResponseDto })
  @SerializeOptions({ type: QuestUnclaimedResponseDto, excludeExtraneousValues: true })
  async unclaimed(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
  ): Promise<QuestUnclaimedResponseDto> {
    return { count: await this.quests.unclaimedCount(userId, slug) };
  }

  // Featured quests for the Home block — public; authed viewers get status.
  @Get(":slug/quests/featured")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: PublicQuestResponseDto, isArray: true })
  @SerializeOptions({ type: PublicQuestResponseDto, excludeExtraneousValues: true })
  getFeatured(
    @OptionalUser() userId: string | null,
    @Param("slug") slug: string,
  ): Promise<PublicQuestResponseDto[]> {
    return this.quests.getFeatured(slug, userId ?? undefined);
  }

  @Post(":slug/quests/:id/start")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: QuestActionResultResponseDto })
  @SerializeOptions({ type: QuestActionResultResponseDto, excludeExtraneousValues: true })
  start(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("id") id: string,
  ): Promise<QuestActionResultResponseDto> {
    return this.quests.start(userId, slug, id);
  }

  @Post(":slug/quests/:id/claim")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: QuestClaimResultResponseDto })
  @SerializeOptions({ type: QuestClaimResultResponseDto, excludeExtraneousValues: true })
  claim(
    @CurrentUser() userId: string,
    @Param("slug") slug: string,
    @Param("id") id: string,
  ): Promise<QuestClaimResultResponseDto> {
    return this.quests.claim(userId, slug, id);
  }
}
