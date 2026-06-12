import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { MailerService } from "../src/common/mailer/mailer.service";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { RedisService } from "../src/common/redis/redis.service";

describe("Auth OTP flow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  const sentCodes = new Map<string, string>();
  const mailerMock = {
    sendOtp: vi.fn((email: string, code: string) => {
      sentCodes.set(email, code);
      return Promise.resolve();
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailerService)
      .useValue(mailerMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  afterEach(async () => {
    sentCodes.clear();
    await prisma.user.deleteMany();
    await redis.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): ReturnType<INestApplication["getHttpServer"]> => app.getHttpServer();

  async function login(email: string): Promise<{ refreshCookie: string; accessToken: string }> {
    await request(server()).post("/api/v1/auth/otp/request").send({ email }).expect(201);
    const code = sentCodes.get(email);
    const res = await request(server())
      .post("/api/v1/auth/otp/verify")
      .send({ email, code })
      .expect(201);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
    return { refreshCookie: refreshCookie ?? "", accessToken: res.body.accessToken as string };
  }

  it("issues tokens + httpOnly cookies on the full OTP cycle", async () => {
    const email = "e2e-cycle@test.local";
    const { refreshCookie, accessToken } = await login(email);
    expect(accessToken).toBeTypeOf("string");
    expect(refreshCookie).toContain("HttpOnly");
    expect(sentCodes.get(email)).toMatch(/^\d{6}$/);
  });

  it("rejects a wrong code with 401", async () => {
    const email = "e2e-wrong@test.local";
    await request(server()).post("/api/v1/auth/otp/request").send({ email }).expect(201);
    await request(server())
      .post("/api/v1/auth/otp/verify")
      .send({ email, code: "000000" })
      .expect(401);
  });

  it("rotates the refresh token", async () => {
    const { refreshCookie } = await login("e2e-rotate@test.local");
    const res = await request(server())
      .post("/api/v1/auth/refresh")
      .set("Cookie", refreshCookie)
      .expect(201);
    expect(res.body.accessToken).toBeTypeOf("string");
  });

  it("re-issues a benign replay within the grace window (no false reuse)", async () => {
    const { refreshCookie } = await login("e2e-grace@test.local");
    // First refresh rotates; the original token becomes prevJti.
    await request(server()).post("/api/v1/auth/refresh").set("Cookie", refreshCookie).expect(201);
    // Immediate replay of the just-rotated token = benign race → re-issued, not killed.
    await request(server()).post("/api/v1/auth/refresh").set("Cookie", refreshCookie).expect(201);
  });

  it("detects genuine refresh token reuse and kills the session", async () => {
    const original = (await login("e2e-reuse@test.local")).refreshCookie; // jti A
    // Rotate twice so A is older than the grace-tracked prevJti (A→B→C).
    const r1 = await request(server())
      .post("/api/v1/auth/refresh")
      .set("Cookie", original)
      .expect(201);
    const rotated = (r1.headers["set-cookie"] as unknown as string[]).find((c) =>
      c.startsWith("refresh_token="),
    );
    await request(server())
      .post("/api/v1/auth/refresh")
      .set("Cookie", rotated ?? "")
      .expect(201);
    // A is now neither active (C) nor prev (B) → outside grace → reuse → 401.
    await request(server()).post("/api/v1/auth/refresh").set("Cookie", original).expect(401);
  });
});
