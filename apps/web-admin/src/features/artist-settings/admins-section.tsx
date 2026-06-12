import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getListArtistAdminsQueryKey,
  useCancelArtistAdminGrant,
  useListArtistAdmins,
} from "@/api/generated/artist-settings/artist-settings";
import { AddAdminDialog } from "@/features/artist-settings/add-admin-dialog";
import { DataTable } from "@/components/data-table";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminRow = {
  id: string;
  email: string;
  status: "active" | "pending";
  createdAt: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

export function AdminsSection() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useListArtistAdmins();
  const [addOpen, setAddOpen] = useState(false);

  const cancel = useCancelArtistAdminGrant({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListArtistAdminsQueryKey() });
        toast.success("Invitation cancelled");
      },
      onError: () => toast.error("Failed to cancel"),
    },
  });

  async function handleCancel(id: string, email: string) {
    const ok = await confirm({
      title: `Cancel invitation for ${email}?`,
      description: "They won't be granted admin access on their first sign-in.",
      confirmLabel: "Cancel invitation",
      destructive: true,
    });
    if (ok) {
      cancel.mutate({ id });
    }
  }

  const columns = useMemo<ColumnDef<AdminRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        size: 360,
        cell: ({ row }) => (
          <span className="truncate text-sm font-medium">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const active = row.original.status === "active";
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
              )}
            >
              {row.original.status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Added",
        size: 150,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 56,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => void handleCancel(row.original.id, row.original.email)}
                aria-label="Cancel invitation"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : null,
      },
    ],
    // handlers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const admins = data?.admins ?? [];
  const pending = data?.pending ?? [];
  // Active first, then pending (default order; the Status column stays sortable).
  const rows: AdminRow[] = [
    ...admins.map((a) => ({
      id: a.id,
      email: a.email,
      status: "active" as const,
      createdAt: a.createdAt,
    })),
    ...pending.map((p) => ({
      id: p.id,
      email: p.email,
      status: "pending" as const,
      createdAt: p.createdAt,
    })),
  ];

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Admins
          </h2>
          <p className="text-xs text-muted-foreground">Users with admin access to this artist.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add admin
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{admins.length}</span>{" "}
        {admins.length === 1 ? "admin" : "admins"}
        {pending.length > 0 ? ` · ${pending.length} pending` : ""}
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          storageKey="admin-admins"
          pinFirstColumn
          pinLastColumn
          emptyMessage="No admins yet."
        />
      )}

      <AddAdminDialog open={addOpen} onOpenChange={setAddOpen} />
    </section>
  );
}
