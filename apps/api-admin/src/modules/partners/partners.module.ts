import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { UploadsModule } from "../../common/uploads/uploads.module";
import { PartnersController } from "./partners.controller";
import { PartnersService } from "./partners.service";

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
