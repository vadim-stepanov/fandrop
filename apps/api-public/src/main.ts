import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const config = app.get(ConfigService);
  // Admin SPA calls api-public directly (auth authority) → needs CORS with
  // credentials so the refresh/sid cookies travel. web-public proxies
  // server-side and needs no CORS.
  app.enableCors({
    origin: config.get<string>("WEB_ADMIN_URL") ?? "http://localhost:5173",
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FanDrop Public API")
    .setDescription("Public backend: auth, artists, store, leaderboard, inventory")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>("API_PUBLIC_PORT") ?? 3001;
  await app.listen(port);
}

void bootstrap();
