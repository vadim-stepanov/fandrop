import { Injectable, Logger } from "@nestjs/common";
import { unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { UPLOADS_ROOT } from "./uploads.options";

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // Deletes the file an upload URL points to. No-op for URLs that aren't ours
  // (no `/uploads/` segment) or that escape the uploads root (path traversal).
  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) {
      return;
    }
    const marker = "/uploads/";
    const idx = url.indexOf(marker);
    if (idx === -1) {
      return;
    }
    const relative = url.slice(idx + marker.length);
    const root = resolve(UPLOADS_ROOT);
    const target = resolve(join(UPLOADS_ROOT, relative));
    if (target !== root && !target.startsWith(root + sep)) {
      return;
    }
    try {
      await unlink(target);
    } catch (err) {
      // Already gone is fine; anything else is worth a warning, not a failure.
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn(`Failed to delete upload "${relative}": ${String(err)}`);
      }
    }
  }

  async deleteManyByUrl(urls: (string | null | undefined)[]): Promise<void> {
    await Promise.all(urls.map((url) => this.deleteByUrl(url)));
  }
}
