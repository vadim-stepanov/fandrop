import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { AvatarController } from "./avatar.controller";
import { AvatarService } from "./avatar.service";

@Module({
  imports: [AuthModule],
  controllers: [AvatarController],
  providers: [AvatarService],
})
export class AvatarModule {}
