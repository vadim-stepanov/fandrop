import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ArtistModule } from "./modules/artist/artist.module";
import { ArtistCreateCommand } from "./cli/artist-create.command";
import { validateEnv } from "./common/config/env.schema";
import { PrismaModule } from "./common/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ["../../.env"],
    }),
    PrismaModule,
    ArtistModule,
  ],
  providers: [ArtistCreateCommand],
})
export class CliModule {}
