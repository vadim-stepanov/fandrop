import { execSync } from "node:child_process";

const TEST_DATABASE_URL = "postgresql://fandrop:dev@localhost:5432/fandrop_test";

// Keep the dedicated test DB schema in sync before the suite runs. The DB itself
// is created once (docker exec ... createdb fandrop_test); this only migrates.
export default function setup(): void {
  execSync("pnpm --filter @fandrop/db exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
