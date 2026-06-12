import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

// Infra route — unversioned: stays at /api/health (not /api/v1/health).
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(): Promise<{ status: string; db: string; redis: string }> {
    let db = "up";
    let redis = "up";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "down";
    }
    try {
      await this.redis.ping();
    } catch {
      redis = "down";
    }

    if (db === "down" || redis === "down") {
      throw new ServiceUnavailableException({ status: "error", db, redis });
    }
    return { status: "ok", db, redis };
  }
}
