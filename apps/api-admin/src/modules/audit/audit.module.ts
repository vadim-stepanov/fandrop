import { Global, Module } from "@nestjs/common";

import { AuthModule } from "../../common/auth/auth.module";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

// Global so any admin module can inject AuditService to record actions.
@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
