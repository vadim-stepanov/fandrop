import { Injectable, Logger } from "@nestjs/common";
import { unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { PrismaService } from "../../common/prisma/prisma.service";
import { UPLOADS_ROOT } from "./avatar.options";

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Store the uploaded avatar (wins over Google) and delete the previously
  // uploaded file. Returns the new effective avatar.
  async setAvatar(userId: string, url: string): Promise<string> {
    const prev = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
    await this.deleteByUrl(prev?.avatarUrl);
    return url;
  }

  // Drop the uploaded avatar → fall back to the Google avatar (if any). Returns
  // the effective avatar after removal.
  async removeAvatar(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, googleAvatarUrl: true },
    });
    if (user?.avatarUrl) {
      await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
      await this.deleteByUrl(user.avatarUrl);
    }
    return user?.googleAvatarUrl ?? null;
  }

  // Deletes the file an uploaded-avatar URL points to (ours only;
  // path-traversal-safe). Google URLs (no `/uploads/`) are ignored.
  private async deleteByUrl(url: string | null | undefined): Promise<void> {
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
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn(`Failed to delete avatar "${relative}": ${String(err)}`);
      }
    }
  }
}
