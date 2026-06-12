import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PUBLIC_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive(),
  MAIL_USER: z.string().min(1),
  MAIL_PASS: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  // "log" = don't send, just log to console (safe default — no Mailtrap quota
  // burned; covers OTP + purchase confirmations). "smtp" = real send (Mailtrap,
  // or a local Mailpit later) — explicit opt-in only.
  MAIL_TRANSPORT: z.enum(["smtp", "log"]).default("log"),
  // Admin SPA origin — allowed for browser CORS (it calls api-public directly,
  // unlike web-public which proxies server-side).
  WEB_ADMIN_URL: z.url().default("http://localhost:5173"),
  // Google OAuth (optional — the app boots without it; the Google sign-in
  // endpoints return 503 when unconfigured). REDIRECT_URI is the web-public
  // callback (the BFF owns session cookies).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.url().optional(),
  // Separate callback for the admin SPA (web-admin owns its own session: access
  // token in memory + refresh cookie on api-public, unlike the public BFF).
  GOOGLE_ADMIN_REDIRECT_URI: z.url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return parsed.data;
}
