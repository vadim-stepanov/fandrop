import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { PointsModule } from "../points/points.module";
import { PurchaseController } from "./purchase.controller";
import { PurchaseService } from "./purchase.service";

// PrismaService + MailerService are @Global; AuthModule provides the JWT guard,
// PointsModule the balance/rank helpers.
@Module({
  imports: [AuthModule, PointsModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
