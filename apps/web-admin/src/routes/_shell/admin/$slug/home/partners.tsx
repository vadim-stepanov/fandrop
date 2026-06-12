import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getListPartnerItemsQueryKey,
  useDeletePartnerItem,
  useListPartnerItems,
} from "@/api/generated/partners/partners";
import type { PartnerResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { CreatePartnerDialog } from "@/features/home/partners/create-partner-dialog";
import { EditPartnerDialog } from "@/features/home/partners/edit-partner-dialog";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_shell/admin/$slug/home/partners")({
  component: PartnersPage,
});

function VisiblePill({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        visible ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

function PartnersPage() {
  const { data: partners, isLoading, isError } = useListPartnerItems();
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useDeletePartnerItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPartnerItemsQueryKey() });
        toast.success("Partner deleted");
      },
      onError: () => toast.error("Failed to delete partner"),
    },
  });

  async function handleDelete(partner: PartnerResponseDto) {
    const ok = await confirm({
      title: `Delete "${partner.name}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: partner.id });
    }
  }

  const columns = useMemo<ColumnDef<PartnerResponseDto>[]>(
    () => [
      {
        id: "logo",
        header: "Logo",
        cell: ({ row }) => (
          <div className="flex h-9 w-24 items-center justify-center overflow-hidden rounded bg-muted">
            {row.original.logoUrl ? (
              <img
                src={row.original.logoUrl}
                alt={row.original.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>
        ),
        size: 120,
        enableSorting: false,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="truncate font-medium">{row.original.name}</div>,
        size: 200,
      },
      {
        id: "externalUrl",
        accessorKey: "externalUrl",
        header: "Link",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.externalUrl || "—"}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "isVisible",
        accessorKey: "isVisible",
        header: "Status",
        cell: ({ row }) => <VisiblePill visible={row.original.isVisible} />,
        size: 100,
      },
      {
        id: "sortOrder",
        accessorKey: "sortOrder",
        header: "Order",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.sortOrder}</span>,
        size: 80,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.original.name}`}
              onClick={() => setEditingId(row.original.id)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.original.name}`}
              onClick={() => void handleDelete(row.original)}
            >
              <Trash2 className="size-3.5 text-destructive" aria-hidden />
            </Button>
          </div>
        ),
        size: 90,
        enableSorting: false,
      },
    ],
    // handlers (confirm / deleteMutation / setEditingId) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const nextSort = partners?.length ? Math.max(...partners.map((p) => p.sortOrder)) + 1 : 0;
  const editingPartner = partners?.find((p) => p.id === editingId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Home section"
        title="Partners"
        description="Partner / sponsor logos with external links, shown on the public Partners section."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{partners?.length ?? 0}</span> partners
        </p>
        <CreatePartnerDialog nextSort={nextSort} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load partners.</p>}

      {partners && (
        <DataTable
          columns={columns}
          data={partners}
          fitContainer
          emptyMessage="No partners yet. Click “Add partner” to create the first one."
        />
      )}

      {editingPartner && (
        <EditPartnerDialog
          partner={editingPartner}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
            }
          }}
        />
      )}
    </>
  );
}
