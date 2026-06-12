import { Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";

import { RedisService } from "../redis/redis.service";
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from "./auth.constants";

export type OtpVerifyResult = "ok" | "invalid" | "expired" | "too_many";

@Injectable()
export class OtpService {
  constructor(private readonly redis: RedisService) {}

  private key(email: string): string {
    return `otp:${email}`;
  }

  async generate(email: string): Promise<string> {
    const code = randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, "0");
    const key = this.key(email);
    await this.redis.del(key);
    await this.redis.hset(key, { code, attempts: 0 });
    await this.redis.expire(key, OTP_TTL_SECONDS);
    return code;
  }

  async verify(email: string, code: string): Promise<OtpVerifyResult> {
    const key = this.key(email);
    const data = await this.redis.hgetall(key);

    if (!data.code) {
      return "expired";
    }
    if (Number(data.attempts) >= OTP_MAX_ATTEMPTS) {
      await this.redis.del(key);
      return "too_many";
    }
    if (data.code !== code) {
      const attempts = await this.redis.hincrby(key, "attempts", 1);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.del(key);
      }
      return "invalid";
    }

    await this.redis.del(key);
    return "ok";
  }
}
