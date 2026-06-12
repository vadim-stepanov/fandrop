import { defineConfig } from "tsup";

export default defineConfig({
  // index = client-safe (types + helpers, no runtime deps); bus = server-only.
  entry: ["src/index.ts", "src/bus.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  platform: "node",
  external: ["ioredis"],
});
