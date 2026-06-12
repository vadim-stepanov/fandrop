import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { getListRulesQueryKey, useDeleteRule, useListRules } from "@/api/generated/rules/rules";
import type { RuleResponseDto } from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { CreateRuleDialog } from "@/features/home/rules/create-rule-dialog";
import { EditRuleDialog } from "@/features/home/rules/edit-rule-dialog";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RULE_ITEMS_MAX } from "@/lib/admin/text-limits";

export const Route = createFileRoute("/_shell/admin/$slug/home/rules")({
  component: RulesPage,
});

function RulesPage() {
  const { data: rules, isLoading, isError } = useListRules();
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useDeleteRule({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListRulesQueryKey() });
        toast.success("Rule deleted");
      },
      onError: () => toast.error("Failed to delete rule"),
    },
  });

  async function handleDelete(rule: RuleResponseDto) {
    const ok = await confirm({
      title: `Delete "${rule.title}"?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: rule.id });
    }
  }

  const columns = useMemo<ColumnDef<RuleResponseDto>[]>(
    () => [
      {
        id: "stepNumber",
        accessorKey: "stepNumber",
        header: "Step",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.stepNumber}</span>,
        size: 70,
      },
      {
        id: "title",
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <div className="truncate font-medium">{row.original.title}</div>,
        size: 220,
      },
      {
        id: "body",
        accessorKey: "body",
        header: "Body",
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">{row.original.body || "—"}</div>
        ),
        enableSorting: false,
      },
      {
        id: "isVisible",
        accessorKey: "isVisible",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.original.isVisible ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {row.original.isVisible ? "Visible" : "Hidden"}
          </span>
        ),
        size: 110,
        enableSorting: false,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.original.title}`}
              onClick={() => setEditingId(row.original.id)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
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
        size: 90,
        enableSorting: false,
      },
    ],
    // handlers (confirm / deleteMutation.mutate / setEditingId) are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const nextStep = rules?.length ? Math.max(...rules.map((r) => r.stepNumber)) + 1 : 1;
  const atLimit = (rules?.length ?? 0) >= RULE_ITEMS_MAX;
  const editingRule = rules?.find((r) => r.id === editingId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Home section"
        title="Rules"
        description={`Steps shown on the public Rules section. Max ${RULE_ITEMS_MAX}.`}
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{rules?.length ?? 0}</span> /{" "}
          {RULE_ITEMS_MAX} rules
        </p>
        <CreateRuleDialog nextStep={nextStep} atLimit={atLimit} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load rules.</p>}

      {rules && (
        <DataTable
          columns={columns}
          data={rules}
          fitContainer
          emptyMessage="No rules yet. Click “Add rule” to create the first one."
        />
      )}

      {editingRule && (
        <EditRuleDialog
          rule={editingRule}
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
