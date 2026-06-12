import { defineConfig, devices } from "@playwright/test";

// E2E runs against a running dev stack (`pnpm dev`) with a seeded "aurora"
// artist. Kept out of the unit runners — Playwright owns the `e2e/` dir.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
