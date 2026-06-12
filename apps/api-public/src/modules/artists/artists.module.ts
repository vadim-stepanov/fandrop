import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { PointsModule } from "../points/points.module";
import { ArtistsController } from "./artists.controller";
import { ArtistsService } from "./artists.service";

@Module({
  imports: [AuthModule, PointsModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
