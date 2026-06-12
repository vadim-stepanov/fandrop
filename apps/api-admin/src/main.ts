import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService);
  // Admin SPA calls api-admin directly → needs CORS with credentials.
  app.enableCors({
    origin: config.get<string>("WEB_ADMIN_URL") ?? "http://localhost:5173",
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FanDrop Admin API")
    .setDescription("Admin backend: artist-scoped CRUD, moderation, uploads")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  // operationId = bare method name → clean Orval hook names (useMe, not
  // useMeControllerMe). Method names must stay unique across controllers.
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
  SwaggerModule.setup("docs", app, swaggerDoc);

  const port = config.get<number>("API_ADMIN_PORT") ?? 3002;
  await app.listen(port);
}

void bootstrap();
