import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { ArtistAdminGuard } from "./artist-admin.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { SessionService } from "./session.service";

@Module({
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, ArtistAdminGuard, SessionService],
  // Re-export JwtModule so JwtService resolves wherever the guards are used.
  exports: [JwtAuthGuard, ArtistAdminGuard, JwtModule, SessionService],
})
export class AuthModule {}
