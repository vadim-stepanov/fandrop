import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  platform: "node",
  // Generated Prisma client uses import.meta.url; shims inject it for the CJS output.
  shims: true,
  // Real runtime deps stay external; the generated client (relative import) is bundled in.
  external: ["@prisma/client", "@prisma/adapter-pg", "pg"],
});
