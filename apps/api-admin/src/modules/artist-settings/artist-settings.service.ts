import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ARTIST_HOME_UPDATED } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AddAdminResponseDto, AdminsListResponseDto } from "./dto/admins.dto";
import { ArtistSettingsResponseDto, UpdateArtistSettingsDto } from "./dto/artist-settings.dto";

@Injectable()
export class ArtistSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
    private readonly audit: AuditService,
  ) {}

  async getSettings(artistId: string): Promise<ArtistSettingsResponseDto> {
    const [artist, adminCount] = await Promise.all([
      this.prisma.artist.findUniqueOrThrow({
        where: { id: artistId },
        select: { name: true, slug: true, logoUrl: true, signupBonusPoints: true },
      }),
      this.prisma.artistUser.count({ where: { artistId, role: "ARTIST_ADMIN" } }),
    ]);
    return { ...artist, adminCount };
  }

  async updateSettings(
    artistId: string,
    adminUserId: string,
    dto: UpdateArtistSettingsDto,
  ): Promise<void> {
    const before = await this.prisma.artist.findUniqueOrThrow({
      where: { id: artistId },
      select: { name: true, logoUrl: true, signupBonusPoints: true },
    });
    const after = await this.prisma.artist.update({
      where: { id: artistId },
      data: {
        name: dto.name.trim(),
        logoUrl: (dto.logoUrl ?? "").trim() || null,
        signupBonusPoints: dto.signupBonusPoints,
      },
      select: { name: true, logoUrl: true, signupBonusPoints: true },
    });
    // Name/logo show on public pages → refetch viewers.
    await this.bus.publish(ARTIST_HOME_UPDATED, { artistId });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "UPDATE",
      entityType: "ARTIST",
      entityId: artistId,
      beforePayload: before,
      afterPayload: after,
    });
  }

  async listAdmins(artistId: string): Promise<AdminsListResponseDto> {
    const [admins, pending] = await Promise.all([
      this.prisma.artistUser.findMany({
        where: { artistId, role: "ARTIST_ADMIN" },
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true, user: { select: { email: true } } },
      }),
      this.prisma.artistAdminGrant.findMany({
        where: { artistId },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, createdAt: true },
      }),
    ]);
    return {
      admins: admins.map((a) => ({ id: a.id, email: a.user.email, createdAt: a.createdAt })),
      pending,
    };
  }

  // Existing member → promote to ARTIST_ADMIN (instant). Otherwise → ArtistAdminGrant,
  // consumed (→ ARTIST_ADMIN) on that email's first OTP login.
  async addAdmin(
    artistId: string,
    adminUserId: string,
    rawEmail: string,
  ): Promise<AddAdminResponseDto> {
    // Normalize so the grant matches the email a fan later signs in with (OTP
    // and Google both normalize the same way — one address = one account).
    const email = rawEmail.trim().toLowerCase();
    const member = await this.prisma.artistUser.findFirst({
      where: { artistId, user: { email } },
      select: { id: true, role: true },
    });
    if (member) {
      if (member.role === "ARTIST_ADMIN") {
        throw new BadRequestException("Already an admin of this artist");
      }
      await this.prisma.artistUser.update({
        where: { id: member.id },
        data: { role: "ARTIST_ADMIN" },
      });
      await this.audit.log({
        adminUserId,
        artistId,
        action: "UPDATE",
        entityType: "ARTIST_USER",
        entityId: member.id,
        beforePayload: { role: "USER" },
        afterPayload: { role: "ARTIST_ADMIN" },
        reason: `Granted artist-admin (${email})`,
      });
      return { status: "instant" };
    }

    const existing = await this.prisma.artistAdminGrant.findUnique({
      where: { artistId_email: { artistId, email } },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException("An invitation for this email is already pending");
    }
    const grant = await this.prisma.artistAdminGrant.create({
      data: { artistId, email },
      select: { id: true },
    });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "CREATE",
      entityType: "ARTIST_ADMIN_GRANT",
      entityId: grant.id,
      afterPayload: { email },
    });
    return { status: "pending" };
  }

  async cancelGrant(artistId: string, adminUserId: string, grantId: string): Promise<void> {
    const grant = await this.prisma.artistAdminGrant.findFirst({
      where: { id: grantId, artistId },
      select: { id: true, email: true },
    });
    if (!grant) {
      throw new NotFoundException("Invitation not found");
    }
    await this.prisma.artistAdminGrant.delete({ where: { id: grantId } });
    await this.audit.log({
      adminUserId,
      artistId,
      action: "DELETE",
      entityType: "ARTIST_ADMIN_GRANT",
      entityId: grantId,
      beforePayload: { email: grant.email },
    });
  }
}
