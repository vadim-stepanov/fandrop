import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { useListStoreItems } from "@/api/generated/store/store";
import type { StoreItemResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { FeaturedPositionDialog } from "@/features/store/featured-position-dialog";
import { RARITY_BADGE } from "@/features/store/store-bits";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin/$slug/home/store")({
  component: HomeStoreSectionPage,
});

function HomeStoreSectionPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: items, isLoading, isError } = useListStoreItems();
  const [editingId, setEditingId] = useState<string | null>(null);

  function openItem(id: string) {
    void navigate({ to: "/admin/$slug/store/$itemId", params: { slug, itemId: id } });
  }

  // Only items actually on Home (featuredPos > 0), in display order. Setting an
  // item's position to 0 (via the pencil) drops it from Home and this table.
  const featured = useMemo(() => {
    if (!items) return items;
    return items.filter((i) => i.featuredPos > 0).sort((a, b) => a.featuredPos - b.featuredPos);
  }, [items]);

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
        size: 240,
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.category}</span>
        ),
        size: 130,
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
        size: 120,
      },
      {
        id: "featuredPos",
        accessorKey: "featuredPos",
        header: "Featured",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.featuredPos}</span>
        ),
        size: 110,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Set featured position for ${row.original.title}`}
              onClick={() => setEditingId(row.original.id)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </div>
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    [],
  );

  const editingItem = items?.find((i) => i.id === editingId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Home section"
        title="Store"
        description="Items shown in the Store block on the public Home. Use the pencil to set a featured position (1 = first; 0 = off). Click a row to edit the full item."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load store items.</p>}

      {featured && (
        <DataTable
          columns={columns}
          data={featured}
          fitContainer
          onRowClick={(item) => openItem(item.id)}
          emptyMessage="No items on Home yet. In the Store catalog, edit an item and set a Featured position."
        />
      )}

      {editingItem && (
        <FeaturedPositionDialog
          item={editingItem}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      )}
    </>
  );
}
