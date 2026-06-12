import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { diskStorage } from "multer";

// Uploaded files live under apps/api-admin/uploads (cwd at runtime) and are
// served statically at /uploads via ServeStaticModule (see app.module).
export const UPLOADS_ROOT = join(process.cwd(), "uploads");

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export const VIDEO_MAX_BYTES = 15 * 1024 * 1024;
export const VIDEO_MIME = new Set(["video/mp4"]);

function multerOptions(subdir: string, allowedMime: Set<string>, maxBytes: number): MulterOptions {
  const dest = join(UPLOADS_ROOT, subdir);
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      if (!allowedMime.has(file.mimetype)) {
        cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        return;
      }
      cb(null, true);
    },
  };
}

export const imageUploadOptions = multerOptions("images", IMAGE_MIME, IMAGE_MAX_BYTES);
export const videoUploadOptions = multerOptions("videos", VIDEO_MIME, VIDEO_MAX_BYTES);
