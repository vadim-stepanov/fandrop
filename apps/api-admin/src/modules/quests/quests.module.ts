import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { UploadsModule } from "../../common/uploads/uploads.module";
import { QuestsController } from "./quests.controller";
import { QuestsService } from "./quests.service";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [QuestsController],
  providers: [QuestsService],
})
export class QuestsModule {}
