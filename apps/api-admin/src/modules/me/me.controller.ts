import { Controller, Get, SerializeOptions, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";

import { ArtistAdminGuard } from "../../common/auth/artist-admin.guard";
import type { AdminContext } from "../../common/auth/auth.types";
import { CurrentAdmin } from "../../common/auth/current-admin.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MeResponseDto } from "./dto/me-response.dto";

@ApiBearerAuth()
@Controller("me")
@UseGuards(JwtAuthGuard, ArtistAdminGuard)
@SerializeOptions({ type: MeResponseDto, excludeExtraneousValues: true })
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ type: MeResponseDto })
  async me(@CurrentAdmin() admin: AdminContext): Promise<MeResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: admin.user.id },
      select: { avatarUrl: true, googleAvatarUrl: true },
    });
    return {
      user: {
        ...admin.user,
        avatarUrl: user?.avatarUrl ?? user?.googleAvatarUrl ?? null,
      },
      artist: admin.artist,
    };
  }
}
