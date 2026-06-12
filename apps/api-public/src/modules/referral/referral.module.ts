import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { ReferralController } from "./referral.controller";
import { ReferralService } from "./referral.service";

@Module({
  imports: [AuthModule],
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}
