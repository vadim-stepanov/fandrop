import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { UploadsModule } from "../../common/uploads/uploads.module";
import { PromoController } from "./promo.controller";
import { PromoService } from "./promo.service";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [PromoController],
  providers: [PromoService],
})
export class PromoModule {}
