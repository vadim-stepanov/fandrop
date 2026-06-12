import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { diskStorage } from "multer";

// Avatars live under apps/api-public/uploads/avatars (cwd at runtime) and are
// served statically at /uploads via ServeStaticModule (see app.module). Small
// cap — the client uploads an already-cropped square.
export const UPLOADS_ROOT = join(process.cwd(), "uploads");
const AVATAR_DIR = join(UPLOADS_ROOT, "avatars");

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export const avatarUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(AVATAR_DIR, { recursive: true });
      cb(null, AVATAR_DIR);
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!AVATAR_MIME.has(file.mimetype)) {
      cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      return;
    }
    cb(null, true);
  },
};
