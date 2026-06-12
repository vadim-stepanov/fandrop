import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { useListHomeSections } from "@/api/generated/home/home";
import type { HomeSectionResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { EditSectionDialog } from "@/features/home/edit-section-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/_shell/admin/$slug/home/")({
  component: HomeSectionsPage,
});

// Section keys that have a content-editor page (row click navigates there).
// Others get one as their type slice lands.
const SECTION_PAGE: Partial<
  Record<
    HomeSectionResponseDto["key"],
    | "/admin/$slug/home/rules"
    | "/admin/$slug/home/promo"
    | "/admin/$slug/home/partners"
    | "/admin/$slug/home/store"
    | "/admin/$slug/home/leaderboard"
  >
> = {
  RULES: "/admin/$slug/home/rules",
  PROMO: "/admin/$slug/home/promo",
  PARTNERS: "/admin/$slug/home/partners",
  STORE: "/admin/$slug/home/store",
  LEADERBOARD: "/admin/$slug/home/leaderboard",
};

function StatusPill({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        visible ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

function HomeSectionsPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: sections, isLoading, isError } = useListHomeSections();
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<HomeSectionResponseDto>[]>(
    () => [
      {
        id: "section",
        accessorKey: "key",
        header: "Section",
        cell: ({ row }) => <span className="font-medium">{row.original.key}</span>,
        size: 160,
      },
      {
        id: "sortOrder",
        accessorKey: "sortOrder",
        header: "Order",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.sortOrder}</span>,
        size: 90,
      },
      {
        id: "visibility",
        accessorKey: "isVisible",
        header: "Visibility",
        cell: ({ row }) => <StatusPill visible={row.original.isVisible} />,
        size: 120,
        enableSorting: false,
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <div className="truncate text-sm">{row.original.title || "—"}</div>,
      },
      {
        id: "subtitle",
        accessorKey: "subtitle",
        header: "Subtitle",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.subtitle || "—"}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "edit",
        header: "",
        // stopPropagation so the pencil doesn't also trigger the row click.
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.original.key} section`}
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

  const editingSection = sections?.find((s) => s.id === editingId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Pages"
        title="Home sections"
        description="Click a section to edit its content; use the pencil to edit the section shell."
      />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load sections.</p>}

      {sections && (
        <DataTable
          columns={columns}
          data={sections}
          fitContainer
          emptyMessage="No home sections yet."
          onRowClick={(section) => {
            const to = SECTION_PAGE[section.key];
            if (to) {
              void navigate({ to, params: { slug } });
            }
          }}
        />
      )}

      {editingSection && (
        <EditSectionDialog
          section={editingSection}
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
