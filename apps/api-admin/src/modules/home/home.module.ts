import { Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { HomeController } from "./home.controller";
import { HomeService } from "./home.service";

@Module({
  imports: [AuthModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
