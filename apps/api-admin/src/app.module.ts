import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";

import { validateEnv } from "./common/config/env.schema";
import { ArtistSettingsModule } from "./modules/artist-settings/artist-settings.module";
import { EventsModule } from "./common/events/events.module";
import { HealthModule } from "./common/health/health.module";
import { HomeModule } from "./modules/home/home.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { MeModule } from "./modules/me/me.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { AuditModule } from "./modules/audit/audit.module";
import { PromoModule } from "./modules/promo/promo.module";
import { QuestsModule } from "./modules/quests/quests.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { RulesModule } from "./modules/rules/rules.module";
import { SocialLinksModule } from "./modules/social-links/social-links.module";
import { StoreModule } from "./modules/store/store.module";
import { UploadsModule } from "./common/uploads/uploads.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Monorepo keeps a single root .env; cwd at runtime is apps/api-admin.
      envFilePath: ["../../.env"],
    }),
    // Serve uploaded media at /uploads (cwd at runtime = apps/api-admin).
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "uploads"),
      serveRoot: "/uploads",
    }),
    PrismaModule,
    RedisModule,
    EventsModule,
    AuditModule,
    ArtistSettingsModule,
    MeModule,
    HomeModule,
    LeaderboardModule,
    RulesModule,
    PromoModule,
    PartnersModule,
    StoreModule,
    QuestsModule,
    SocialLinksModule,
    ReferralModule,
    UsersModule,
    UploadsModule,
    HealthModule,
  ],
})
export class AppModule {}
