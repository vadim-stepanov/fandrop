import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type { Env } from "../config/env.schema";

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService<Env, true>) {
    // lazyConnect: defer the socket until onModuleInit so a failure surfaces
    // at boot (fail-fast) rather than as a background reconnect loop.
    super(config.get("REDIS_URL", { infer: true }), { lazyConnect: true });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
    this.logger.log("Connected to Redis");
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}
