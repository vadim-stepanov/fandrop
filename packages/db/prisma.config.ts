import { resolve } from "node:path";

import { defineConfig, env } from "prisma/config";

// Monorepo keeps a single root .env; Prisma CLI runs with cwd = packages/db.
if (!process.env.DATABASE_URL) {
  process.loadEnvFile(resolve(process.cwd(), "../../.env"));
}

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
