import { Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import { Prisma } from "@fandrop/db";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { HomeSectionResponseDto } from "./dto/home-section.dto";
import { UpdateHomeSectionDto } from "./dto/update-home-section.dto";

const sectionSelect = {
  id: true,
  key: true,
  isVisible: true,
  sortOrder: true,
  title: true,
  subtitle: true,
} as const satisfies Prisma.ArtistHomeSectionSelect;

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  listSections(artistId: string): Promise<HomeSectionResponseDto[]> {
    return this.prisma.artistHomeSection.findMany({
      where: { artistId },
      orderBy: { sortOrder: "asc" },
      select: sectionSelect,
    });
  }

  async updateSection(
    artistId: string,
    adminUserId: string,
    sectionId: string,
    dto: UpdateHomeSectionDto,
  ): Promise<HomeSectionResponseDto> {
    // Scope to the admin's own artist — never touch another artist's section.
    const before = await this.prisma.artistHomeSection.findFirst({
      where: { id: sectionId, artistId },
      select: sectionSelect,
    });
    if (!before) {
      throw new NotFoundException("Home section not found");
    }
    const updated = await this.prisma.artistHomeSection.update({
      where: { id: sectionId },
      data: {
        isVisible: dto.isVisible,
        sortOrder: dto.sortOrder,
        title: dto.title,
        subtitle: dto.subtitle,
      },
      select: sectionSelect,
    });
    // Signal public viewers to refetch the artist Home (WS = refetch signal).
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST_HOME_SECTION",
      entityId: sectionId,
      beforePayload: before,
      afterPayload: updated,
    });
    return updated;
  }
}
