import { keepPreviousData } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { useListAudit } from "@/api/generated/audit/audit";
import type { AuditEntryDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_shell/admin/$slug/audit")({
  component: AuditPage,
});

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  ADJUST_POINTS: "Adjusted points",
  WIPE_USER: "Wiped user",
  UPDATE_SETTINGS: "Updated settings",
};

const ENTITY_LABELS: Record<string, string> = {
  ARTIST_USER: "Member",
  ARTIST_HOME_SECTION: "Home section",
  ARTIST_PROMO_VARIANT: "Promo",
  ARTIST_RULE_ITEM: "Rule",
  ARTIST_PARTNER_ITEM: "Partner",
  ARTIST_STORE_ITEM: "Store item",
  ARTIST_SOCIAL_LINK: "Social",
  ARTIST_LEADERBOARD_CONFIG: "Leaderboard",
  ARTIST_REFERRAL_SETTINGS: "Referral",
  ARTIST_POINTS_TRANSACTION: "Transaction",
  ARTIST_INVENTORY_ITEM: "Inventory item",
};

const ALL = "ALL";

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}

function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [selected, setSelected] = useState<AuditEntryDto | null>(null);

  const { data, isLoading, isError } = useListAudit(
    { page: String(page), ...(action ? { action } : {}), ...(entityType ? { entityType } : {}) },
    { query: { placeholderData: keepPreviousData } },
  );

  const entries = data?.entries ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = useMemo<ColumnDef<AuditEntryDto>[]>(
    () => [
      {
        id: "when",
        accessorKey: "createdAt",
        header: "When",
        size: 170,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatWhen(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "admin",
        accessorKey: "adminEmail",
        header: "Admin",
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="truncate text-sm">{row.original.adminEmail ?? "—"}</span>
        ),
      },
      {
        id: "action",
        accessorKey: "action",
        header: "Action",
        size: 150,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{actionLabel(row.original.action)}</span>
        ),
      },
      {
        id: "entity",
        accessorKey: "entityType",
        header: "Entity",
        size: 140,
        cell: ({ row }) => <span className="text-sm">{entityLabel(row.original.entityType)}</span>,
      },
      {
        id: "reason",
        accessorKey: "reason",
        header: "Reason",
        size: 240,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.reason ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="pb-12">
      <PageHeader
        title="Audit log"
        description="Every mutating admin action on this artist. Click a row for the full before/after."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={action || ALL}
          onValueChange={(v) => {
            setAction(v === ALL ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {Object.keys(ACTION_LABELS).map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={entityType || ALL}
          onValueChange={(v) => {
            setEntityType(v === ALL ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All entities</SelectItem>
            {Object.keys(ENTITY_LABELS).map((e) => (
              <SelectItem key={e} value={e}>
                {ENTITY_LABELS[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {action || entityType ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAction("");
              setEntityType("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load the audit log.</p>}

      {data && (
        <>
          <DataTable
            columns={columns}
            data={entries}
            enableResize
            storageKey="admin-audit"
            pinFirstColumn
            enableRowHighlight
            onRowClick={setSelected}
            emptyMessage="No audit entries yet."
          />

          <div className="mt-4 flex items-center justify-end gap-3 text-sm">
            <span className="text-muted-foreground">
              Page {data.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={data.page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </>
      )}

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AuditDetailDialog({
  entry,
  onClose,
}: {
  entry: AuditEntryDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {entry ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {actionLabel(entry.action)} · {entityLabel(entry.entityType)}
              </DialogTitle>
              <DialogDescription>
                {formatWhen(entry.createdAt)} · {entry.adminEmail ?? "—"}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Entity id</dt>
              <dd className="truncate font-mono text-xs">{entry.entityId}</dd>
              {entry.reason ? (
                <>
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd>{entry.reason}</dd>
                </>
              ) : null}
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <PayloadBlock title="Before" value={entry.beforePayload} />
              <PayloadBlock title="After" value={entry.afterPayload} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PayloadBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-2 text-xs">
        {value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
