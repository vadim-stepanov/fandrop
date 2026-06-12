import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { QuestsController } from "./quests.controller";
import { QuestsService } from "./quests.service";

@Module({
  imports: [AuthModule],
  controllers: [QuestsController],
  providers: [QuestsService],
})
export class QuestsModule {}
