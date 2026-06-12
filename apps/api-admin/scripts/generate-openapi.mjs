import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "../dist/app.module.js";
import { configureApp } from "../dist/app.setup.js";

// Runs against the COMPILED dist (not tsx): esbuild drops decorator metadata,
// which breaks Nest DI. Boots the app without listen(), emits the spec to a
// file so Orval codegen needs no live server. Requires a reachable DB
// (PrismaModule connects on init).
const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "openapi.json");

try {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: ["error", "warn"],
  });
  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle("FanDrop Admin API")
    .setDescription("Admin backend: artist-scoped CRUD, moderation, uploads")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
  writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
  await app.close();
  console.log(`OpenAPI spec written: ${outPath}`);
} catch (err) {
  console.error("Failed to generate OpenAPI spec:", err);
  process.exit(1);
}
