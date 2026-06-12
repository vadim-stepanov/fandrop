import { Global, Module, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventBus } from "@fandrop/events/bus";

import { AuthModule } from "../auth/auth.module";
import type { Env } from "../config/env.schema";
import { RealtimeGateway } from "./realtime.gateway";

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: EventBus,
      useFactory: (config: ConfigService<Env, true>) =>
        new EventBus(config.get("REDIS_URL", { infer: true })),
      inject: [ConfigService],
    },
    RealtimeGateway,
  ],
  exports: [EventBus],
})
export class EventsModule implements OnModuleDestroy {
  constructor(private readonly bus: EventBus) {}

  async onModuleDestroy(): Promise<void> {
    await this.bus.close();
  }
}
