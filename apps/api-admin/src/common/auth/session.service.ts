import { Injectable } from "@nestjs/common";

import { RedisService } from "../redis/redis.service";

// Read-only session lookup for the WS handshake. Sessions are owned/written by
// api-public (shared Redis); admin only resolves a sid-cookie to its user here.
// Key format mirrors api-public's SessionService (`session:{sid}` → userId).
@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  async getUserIdBySid(sid: string): Promise<string | null> {
    return this.redis.get(`session:${sid}`);
  }
}
