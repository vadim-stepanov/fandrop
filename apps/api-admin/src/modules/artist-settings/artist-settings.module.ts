import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { ArtistSettingsController } from "./artist-settings.controller";
import { ArtistSettingsService } from "./artist-settings.service";

@Module({
  imports: [AuthModule],
  controllers: [ArtistSettingsController],
  providers: [ArtistSettingsService],
})
export class ArtistSettingsModule {}
