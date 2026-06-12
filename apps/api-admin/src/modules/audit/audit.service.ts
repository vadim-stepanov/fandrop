import { Injectable } from "@nestjs/common";
import { type AuditAction, type AuditEntityType, Prisma } from "@fandrop/db";
import { ARTIST_ADMIN_UPDATED, type AdminTopic } from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditPageResponseDto } from "./dto/audit-entry.dto";

const PAGE_SIZE = 50;

// Entity types whose changes show in the Users moderation grid (points /
// inventory / membership). Every audited action also refreshes the Audit view.
const USER_VIEW_ENTITIES: ReadonlySet<string> = new Set([
  "ARTIST_USER",
  "ARTIST_POINTS_TRANSACTION",
  "ARTIST_INVENTORY_ITEM",
]);

// Normalise an entity snapshot to plain JSON (Dates → ISO strings, etc.) so it
// stores cleanly in the Json column regardless of the source row's field types.
function toJson(value: object | null | undefined): Prisma.InputJsonValue | undefined {
  return value == null ? undefined : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);
}

export interface LogAuditInput {
  adminUserId: string;
  artistId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  // Accept any entity snapshot object; cast to Prisma's JSON input inside log().
  beforePayload?: object | null;
  afterPayload?: object | null;
  reason?: string | null;
}

export interface AuditListOptions {
  page: number;
  action?: string;
  entityType?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBus,
  ) {}

  // Append an audit row. Called by admin mutations after the change lands
  // (before-snapshot captured by the caller prior to mutating). The audit write
  // is the single canonical "an admin did something" signal, so it also fans out
  // a live refresh to other admins of this artist (Audit always; Users grid when
  // the change is member-scoped).
  async log(input: LogAuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        artistId: input.artistId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforePayload: toJson(input.beforePayload),
        afterPayload: toJson(input.afterPayload),
        reason: input.reason ?? null,
      },
    });

    const topics: AdminTopic[] = ["audit"];
    if (USER_VIEW_ENTITIES.has(input.entityType)) {
      topics.push("users");
    }
    await this.bus.publish(ARTIST_ADMIN_UPDATED, { artistId: input.artistId, topics });
  }

  async list(artistId: string, options: AuditListOptions): Promise<AuditPageResponseDto> {
    const where: Prisma.AuditLogWhereInput = {
      artistId,
      ...(options.action ? { action: options.action as AuditAction } : {}),
      ...(options.entityType ? { entityType: options.entityType as AuditEntityType } : {}),
    };
    const total = await this.prisma.auditLog.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, options.page), totalPages);

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        entityId: true,
        reason: true,
        beforePayload: true,
        afterPayload: true,
        admin: { select: { email: true } },
      },
    });

    const entries = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      adminEmail: r.admin?.email ?? null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason,
      beforePayload: r.beforePayload,
      afterPayload: r.afterPayload,
    }));

    return { entries, page, totalPages };
  }
}
