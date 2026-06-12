import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  getListStoreItemsQueryKey,
  useDeleteStoreItem,
  useListStoreItems,
} from "@/api/generated/store/store";
import type { StoreItemResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { RARITY_BADGE, StatusPill, formatStorePrice } from "@/features/store/store-bits";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin/$slug/store/")({
  component: StoreCatalogPage,
});

function StoreCatalogPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: items, isLoading, isError } = useListStoreItems();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useDeleteStoreItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListStoreItemsQueryKey() });
        toast.success("Item deleted");
      },
      onError: () => toast.error("Failed to delete item"),
    },
  });

  function openItem(id: string) {
    void navigate({ to: "/admin/$slug/store/$itemId", params: { slug, itemId: id } });
  }

  async function handleDelete(item: StoreItemResponseDto) {
    const ok = await confirm({
      title: `Delete "${item.title}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: item.id });
    }
  }

  const columns = useMemo<ColumnDef<StoreItemResponseDto>[]>(
    () => [
      {
        id: "image",
        header: "",
        cell: ({ row }) => (
          <div className="size-10 overflow-hidden rounded bg-muted">
            {row.original.imageUrl ? (
              <img src={row.original.imageUrl} alt="" className="size-full object-cover" />
            ) : null}
          </div>
        ),
        size: 56,
        enableSorting: false,
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <div className="truncate font-medium">{row.original.title}</div>,
        size: 220,
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.category}</span>
        ),
        size: 120,
      },
      {
        id: "quality",
        accessorKey: "quality",
        header: "Quality",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
              RARITY_BADGE[row.original.quality],
            )}
          >
            {row.original.quality}
          </span>
        ),
        size: 110,
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatStorePrice(row.original)}</span>
        ),
        size: 100,
        enableSorting: false,
      },
      {
        id: "stock",
        accessorKey: "stockCount",
        header: "Stock",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.stockCount ?? "∞"}</span>
        ),
        size: 80,
      },
      {
        id: "isVisible",
        accessorKey: "isVisible",
        header: "Status",
        cell: ({ row }) => <StatusPill visible={row.original.isVisible} />,
        size: 100,
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => void handleDelete(row.original)}
            >
              <Trash2 className="size-3.5 text-destructive" aria-hidden />
            </Button>
          </div>
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    // handlers (confirm / mutations / navigate) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Catalog"
        description="All store items for this artist. Click an item (or the pencil) to edit. Feature items on Home from the Home → Store section."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{items?.length ?? 0}</span> items
        </p>
        <Button onClick={() => void navigate({ to: "/admin/$slug/store/new", params: { slug } })}>
          New item
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load store items.</p>}

      {items && (
        <DataTable
          columns={columns}
          data={items}
          fitContainer
          onRowClick={(item) => openItem(item.id)}
          emptyMessage="No store items yet. Click “New item” to create the first one."
        />
      )}
    </>
  );
}
