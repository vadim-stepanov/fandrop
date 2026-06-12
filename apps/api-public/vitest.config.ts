import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vitest 4 transforms via Oxc by default; disable it so the SWC plugin
  // (which emits NestJS decorator metadata) fully owns the transform.
  oxc: false,
  test: {
    root: "./",
    include: ["test/**/*.e2e-spec.ts", "src/**/*.spec.ts"],
    // Isolated test infra: dedicated DB + a throwaway Redis logical db (15).
    env: {
      DATABASE_URL: "postgresql://fandrop:dev@localhost:5432/fandrop_test",
      REDIS_URL: "redis://localhost:6379/15",
    },
    globalSetup: ["./test/global-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  // SWC transform so NestJS decorator metadata (emitDecoratorMetadata) survives
  // under Vitest — esbuild alone drops it and DI by type breaks.
  plugins: [
    swc.vite({
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
