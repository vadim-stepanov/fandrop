import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

// Infra route — unversioned: stays at /api/health (not /api/v1/health).
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
    return { status: "ok", db: "up" };
  }
}
