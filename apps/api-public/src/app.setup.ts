import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  type INestApplication,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import cookieParser from "cookie-parser";

// Shared app wiring used by both the runtime bootstrap (main.ts) and e2e tests,
// so tests exercise the same prefix / validation / cookie behaviour.
export function configureApp(app: INestApplication): void {
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  // URI versioning: routes become /api/v1/... by default. Infra
  // routes (health) opt out with VERSION_NEUTRAL.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  // No default `strategy`/`excludeExtraneousValues` here — every route supplies
  // its own @SerializeOptions({ type, excludeExtraneousValues: true }). A global
  // `strategy: 'excludeAll'` default would cascade into nested untyped/raw-JSON
  // values during the transform walk and wipe them to `{}` (see CLAUDE.md).
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
