import { Injectable } from "@nestjs/common";

import { REFRESH_TOKEN_TTL_SECONDS } from "./auth.constants";
import { RedisService } from "../redis/redis.service";

export interface SessionEntry {
  sid: string;
  activeJti: string;
  // Previous jti + when it was rotated out — lets refresh tolerate a benign
  // replay of the just-rotated token (multi-tab / reload race / lost cookie)
  // within a short grace window instead of treating it as token reuse.
  prevJti?: string;
  rotatedAt?: number;
}

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  private key(userId: string): string {
    return `user:${userId}`;
  }

  // Reverse index sid → userId, so the WS handshake can resolve a session from
  // a bare sid-cookie (the primary store is keyed by userId).
  private sidKey(sid: string): string {
    return `session:${sid}`;
  }

  async create(userId: string, sid: string, jti: string): Promise<void> {
    const sessions = await this.read(userId);
    sessions.push({ sid, activeJti: jti });
    await this.write(userId, sessions);
    await this.redis.set(this.sidKey(sid), userId, "EX", REFRESH_TOKEN_TTL_SECONDS);
  }

  async findBySid(userId: string, sid: string): Promise<SessionEntry | undefined> {
    const sessions = await this.read(userId);
    return sessions.find((s) => s.sid === sid);
  }

  // Resolve a session's owner from its sid (WS handshake auth). Null = no session.
  async getUserIdBySid(sid: string): Promise<string | null> {
    return this.redis.get(this.sidKey(sid));
  }

  async rotate(userId: string, sid: string, newJti: string): Promise<void> {
    const sessions = await this.read(userId);
    const session = sessions.find((s) => s.sid === sid);
    if (!session) {
      return;
    }
    session.prevJti = session.activeJti;
    session.rotatedAt = Date.now();
    session.activeJti = newJti;
    await this.write(userId, sessions);
    // Keep the reverse index fresh (also backfills pre-existing sessions).
    await this.redis.set(this.sidKey(sid), userId, "EX", REFRESH_TOKEN_TTL_SECONDS);
  }

  async revokeSid(userId: string, sid: string): Promise<void> {
    const remaining = (await this.read(userId)).filter((s) => s.sid !== sid);
    if (remaining.length === 0) {
      await this.redis.del(this.key(userId));
    } else {
      await this.write(userId, remaining);
    }
    await this.redis.del(this.sidKey(sid));
  }

  async revokeAll(userId: string): Promise<void> {
    const sessions = await this.read(userId);
    await Promise.all(sessions.map((s) => this.redis.del(this.sidKey(s.sid))));
    await this.redis.del(this.key(userId));
  }

  private async read(userId: string): Promise<SessionEntry[]> {
    const raw = await this.redis.get(this.key(userId));
    return raw ? (JSON.parse(raw) as SessionEntry[]) : [];
  }

  private async write(userId: string, sessions: SessionEntry[]): Promise<void> {
    await this.redis.set(
      this.key(userId),
      JSON.stringify(sessions),
      "EX",
      REFRESH_TOKEN_TTL_SECONDS,
    );
  }
}
