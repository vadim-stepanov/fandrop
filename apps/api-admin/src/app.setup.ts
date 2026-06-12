import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  type INestApplication,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

// Shared app wiring (reused by main.ts and future e2e tests).
export function configureApp(app: INestApplication): void {
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
