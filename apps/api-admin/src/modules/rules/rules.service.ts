import { Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { ArtistHomeSectionKey, Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRuleDto } from "./dto/create-rule.dto";
import { RuleResponseDto } from "./dto/rule.dto";
import { UpdateRuleDto } from "./dto/update-rule.dto";

const ruleSelect = {
  id: true,
  title: true,
  body: true,
  stepNumber: true,
  isVisible: true,
} as const satisfies Prisma.ArtistRuleItemSelect;

@Injectable()
export class RulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  listRules(artistId: string): Promise<RuleResponseDto[]> {
    return this.prisma.artistRuleItem.findMany({
      where: { section: { artistId, key: ArtistHomeSectionKey.RULES } },
      orderBy: { stepNumber: "asc" },
      select: ruleSelect,
    });
  }

  async createRule(
    artistId: string,
    adminUserId: string,
    dto: CreateRuleDto,
  ): Promise<RuleResponseDto> {
    const section = await this.rulesSection(artistId);
    const rule = await this.prisma.artistRuleItem.create({
      data: {
        sectionId: section.id,
        title: dto.title,
        body: dto.body,
        stepNumber: dto.stepNumber ?? 0,
        isVisible: dto.isVisible ?? true,
      },
      select: ruleSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_RULE_ITEM",
      entityId: rule.id,
      afterPayload: rule,
    });
    return rule;
  }

  async updateRule(
    artistId: string,
    adminUserId: string,
    id: string,
    dto: UpdateRuleDto,
  ): Promise<RuleResponseDto> {
    const before = await this.ownedRule(artistId, id);
    const rule = await this.prisma.artistRuleItem.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        stepNumber: dto.stepNumber,
        isVisible: dto.isVisible,
      },
      select: ruleSelect,
    });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_RULE_ITEM",
      entityId: id,
      beforePayload: before,
      afterPayload: rule,
    });
    return rule;
  }

  async deleteRule(artistId: string, adminUserId: string, id: string): Promise<void> {
    const before = await this.ownedRule(artistId, id);
    await this.prisma.artistRuleItem.delete({ where: { id } });
    await this.publish(artistId);
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_RULE_ITEM",
      entityId: id,
      beforePayload: before,
    });
  }

  private async rulesSection(artistId: string): Promise<{ id: string }> {
    const section = await this.prisma.artistHomeSection.findUnique({
      where: { artistId_key: { artistId, key: ArtistHomeSectionKey.RULES } },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException("RULES section not found");
    }
    return section;
  }

  // Scope every mutation to the admin's own artist + return the row as the audit
  // before-snapshot. A rule whose section belongs to another artist is "not found".
  private async ownedRule(artistId: string, id: string): Promise<RuleResponseDto> {
    const owned = await this.prisma.artistRuleItem.findFirst({
      where: { id, section: { artistId, key: ArtistHomeSectionKey.RULES } },
      select: ruleSelect,
    });
    if (!owned) {
      throw new NotFoundException("Rule not found");
    }
    return owned;
  }

  private async publish(artistId: string): Promise<void> {
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
  }
}
