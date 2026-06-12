import { Controller, Get, Query, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { AuditService } from "./audit.service";
import { AuditPageResponseDto } from "./dto/audit-entry.dto";

// Read-only audit trail for the current artist (admin-scoped).
@ApiBearerAuth()
@Controller("audit")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: AuditPageResponseDto, excludeExtraneousValues: true })
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOkResponse({ type: AuditPageResponseDto })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "action", required: false })
  @ApiQuery({ name: "entityType", required: false })
  listAudit(
    @CurrentAdmin() admin: AdminContext,
    @Query("page") page?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
  ): Promise<AuditPageResponseDto> {
    const pageNum = page ? Math.max(1, Number.parseInt(page, 10) || 1) : 1;
    return this.audit.list(admin.artist.id, { page: pageNum, action, entityType });
  }
}
