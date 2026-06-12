import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getListQuestsQueryKey,
  useDeleteQuest,
  useListQuests,
} from "@/api/generated/quests/quests";
import type { QuestResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { QuestEditorDialog } from "@/features/quests/quest-editor-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin/$slug/quests")({
  component: QuestsPage,
});

function StatusPill({ visible }: { visible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        visible ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
      )}
    >
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

function QuestsPage() {
  const { data: quests, isLoading, isError } = useListQuests();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<{ quest?: QuestResponseDto } | null>(null);

  const deleteMutation = useDeleteQuest({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
        toast.success("Quest deleted");
      },
      onError: () => toast.error("Failed to delete quest"),
    },
  });

  async function handleDelete(quest: QuestResponseDto) {
    const ok = await confirm({
      title: `Delete "${quest.title}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: quest.id });
    }
  }

  const columns = useMemo<ColumnDef<QuestResponseDto>[]>(
    () => [
      {
        id: "image",
        header: "",
        cell: ({ row }) => (
          <div className="grid size-10 place-items-center overflow-hidden rounded bg-muted text-muted-foreground">
            {row.original.imageUrl ? (
              <img src={row.original.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <Target className="size-4" aria-hidden />
            )}
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
        id: "reward",
        accessorKey: "rewardPoints",
        header: "Reward",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.rewardPoints.toLocaleString("en-US")} pts
          </span>
        ),
        size: 110,
      },
      {
        id: "featuredPos",
        accessorKey: "featuredPos",
        header: "Featured",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.featuredPos > 0 ? row.original.featuredPos : "—"}
          </span>
        ),
        size: 90,
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
    // handlers (confirm / mutations) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Quests"
        title="Quests"
        description="“Visit a link → claim points.” Feature quests on Home with a position > 0. Click a quest to edit."
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{quests?.length ?? 0}</span> quests
        </p>
        <Button onClick={() => setEditing({})}>New quest</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load quests.</p>}

      {quests && (
        <DataTable
          columns={columns}
          data={quests}
          fitContainer
          onRowClick={(quest) => setEditing({ quest })}
          emptyMessage="No quests yet. Click “New quest” to create the first one."
        />
      )}

      {editing && (
        <QuestEditorDialog
          quest={editing.quest}
          open
          onOpenChange={(o) => {
            if (!o) {
              setEditing(null);
            }
          }}
        />
      )}
    </>
  );
}
