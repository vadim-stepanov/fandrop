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
import { CreateRuleDto } from "./dto/create-rule.dto";
import { RuleResponseDto } from "./dto/rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";
import { RulesService } from "./rules.service";

@ApiBearerAuth()
@Controller("home/rules")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: RuleResponseDto, excludeExtraneousValues: true })
export class RulesController {
  constructor(private readonly rules: RulesService) {}

  @Get()
  @ApiOkResponse({ type: RuleResponseDto, isArray: true })
  listRules(@CurrentAdmin() admin: AdminContext): Promise<RuleResponseDto[]> {
    return this.rules.listRules(admin.artist.id);
  }

  @Post()
  @ApiOkResponse({ type: RuleResponseDto })
  createRule(
    @CurrentAdmin() admin: AdminContext,
    @Body() dto: CreateRuleDto,
  ): Promise<RuleResponseDto> {
    return this.rules.createRule(admin.artist.id, admin.user.id, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: RuleResponseDto })
  updateRule(
    @CurrentAdmin() admin: AdminContext,
    @Param("id") id: string,
    @Body() dto: UpdateRuleDto,
  ): Promise<RuleResponseDto> {
    return this.rules.updateRule(admin.artist.id, admin.user.id, id, dto);
  }

  @Delete(":id")
  deleteRule(@CurrentAdmin() admin: AdminContext, @Param("id") id: string): Promise<void> {
    return this.rules.deleteRule(admin.artist.id, admin.user.id, id);
  }
}
