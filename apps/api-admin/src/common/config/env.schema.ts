import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_ADMIN_PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.url(),
  // Publishes cross-service events (e.g. artist.home.updated) via Redis Pub/Sub.
  REDIS_URL: z.url(),
  // Shared with api-public (the auth authority) — used to VERIFY access tokens.
  JWT_ACCESS_SECRET: z.string().min(1),
  // Admin SPA origin — allowed for browser CORS.
  WEB_ADMIN_URL: z.url().default("http://localhost:5173"),
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
