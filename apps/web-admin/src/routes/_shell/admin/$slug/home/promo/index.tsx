import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  getListPromoVariantsQueryKey,
  useDeletePromoVariant,
  useListPromoVariants,
  useSetPromoActive,
} from "@/api/generated/promo/promo";
import type { PromoResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_shell/admin/$slug/home/promo/")({
  component: PromoListPage,
});

function ActivePill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PromoListPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: variants, isLoading, isError } = useListPromoVariants();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: getListPromoVariantsQueryKey() });

  const deleteMutation = useDeletePromoVariant({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Variant deleted");
      },
      onError: () => toast.error("Failed to delete variant"),
    },
  });
  const activateMutation = useSetPromoActive({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Variant set active");
      },
      onError: () => toast.error("Failed to set active"),
    },
  });

  function openVariant(id: string) {
    void navigate({ to: "/admin/$slug/home/promo/$variantId", params: { slug, variantId: id } });
  }

  async function handleDelete(variant: PromoResponseDto) {
    const ok = await confirm({
      title: `Delete "${variant.name}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: variant.id });
    }
  }

  const columns = useMemo<ColumnDef<PromoResponseDto>[]>(
    () => [
      {
        id: "banner",
        header: "Banner",
        cell: ({ row }) => {
          const { videoUrl, bannerUrl, bannerUrlAnon, name } = row.original;
          const image = bannerUrl || bannerUrlAnon;
          return (
            <div className="h-9 w-16 overflow-hidden rounded bg-muted">
              {videoUrl ? (
                <video
                  src={`${videoUrl}#t=0.1`}
                  muted
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : image ? (
                <img src={image} alt={name} className="size-full object-cover" />
              ) : null}
            </div>
          );
        },
        size: 90,
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
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">{row.original.title || "—"}</div>
        ),
        enableSorting: false,
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <ActivePill active={row.original.isActive} />,
        size: 110,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {!row.original.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateMutation.mutate({ id: row.original.id })}
                disabled={activateMutation.isPending}
              >
                <Check className="size-3.5" aria-hidden />
                Set active
              </Button>
            )}
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
        size: 180,
        enableSorting: false,
      },
    ],
    // handlers (confirm / mutations / navigate) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activateMutation.isPending],
  );

  return (
    <>
      <PageHeader
        eyebrow="Home section"
        title="Promo"
        description="Hero variants. The active one renders on the public page (video/banner for signed-in, banner for anonymous). Click a variant to edit."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{variants?.length ?? 0}</span> variants
        </p>
        <Button
          onClick={() => void navigate({ to: "/admin/$slug/home/promo/new", params: { slug } })}
        >
          New variant
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load variants.</p>}

      {variants && (
        <DataTable
          columns={columns}
          data={variants}
          fitContainer
          onRowClick={(variant) => openVariant(variant.id)}
          emptyMessage="No promo variants yet. Click “New variant” to create the first one."
        />
      )}
    </>
  );
}
