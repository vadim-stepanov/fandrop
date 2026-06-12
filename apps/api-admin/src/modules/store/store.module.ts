import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { UploadsModule } from "../../common/uploads/uploads.module";
import { StoreController } from "./store.controller";
import { StoreService } from "./store.service";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
