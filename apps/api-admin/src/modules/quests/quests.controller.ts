import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CreateQuestDto } from "./dto/create-quest.dto";
import { QuestResponseDto } from "./dto/quest.dto";
import { UpdateQuestDto } from "./dto/update-quest.dto";
import { QuestsService } from "./quests.service";

@ApiBearerAuth()
@Controller("quests")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: QuestResponseDto, excludeExtraneousValues: true })
export class QuestsController {
  constructor(private readonly quests: QuestsService) {}

  @Get()
  @ApiOkResponse({ type: QuestResponseDto, isArray: true })
  listQuests(@CurrentAdmin() admin: AdminContext): Promise<QuestResponseDto[]> {
    return this.quests.listQuests(admin.artist.id);
  }

  @Post()
  @ApiOkResponse({ type: QuestResponseDto })
  createQuest(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreateQuestDto,
  ): Promise<QuestResponseDto> {
    return this.quests.createQuest(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: QuestResponseDto })
  updateQuest(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdateQuestDto,
  ): Promise<QuestResponseDto> {
    return this.quests.updateQuest(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deleteQuest(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.quests.deleteQuest(admin.artist.id, admin.user.id, id);
  }
}
