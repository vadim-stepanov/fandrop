import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { join } from "node:path";

import { ArtistsModule } from "./modules/artists/artists.module";
import { AuthModule } from "./common/auth/auth.module";
import { AvatarModule } from "./modules/avatar/avatar.module";
import { validateEnv } from "./common/config/env.schema";
import { EventsModule } from "./common/events/events.module";
import { HealthModule } from "./common/health/health.module";
import { MailerModule } from "./common/mailer/mailer.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PointsModule } from "./modules/points/points.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { PurchaseModule } from "./modules/purchase/purchase.module";
import { QuestsModule } from "./modules/quests/quests.module";
import { RedisModule } from "./common/redis/redis.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { SocialsModule } from "./modules/socials/socials.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Monorepo keeps a single root .env; cwd at runtime is apps/api-public.
      envFilePath: ["../../.env"],
    }),
    // Serve uploaded avatars at /uploads (cwd at runtime = apps/api-public).
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    // Per-IP rate limiting (in-memory store — fine for a single instance).
    // Generous global ceiling; abusable endpoints (OTP) tighten it with
    // @Throttle overrides. Skipped under e2e — supertest hammers auth from
    // one IP and would trip the limits.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      skipIf: () => process.env.NODE_ENV === "test",
    }),
    PrismaModule,
    RedisModule,
    MailerModule,
    AuthModule,
    ArtistsModule,
    AvatarModule,
    PointsModule,
    PurchaseModule,
    QuestsModule,
    SocialsModule,
    OnboardingModule,
    ReferralModule,
    EventsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
