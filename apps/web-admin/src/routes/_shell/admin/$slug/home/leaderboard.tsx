import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getGetLeaderboardConfigQueryKey,
  useGetLeaderboardConfig,
  useUpdateLeaderboardConfig,
} from "@/api/generated/leaderboard/leaderboard";
import type { LeaderboardConfigResponseDto } from "@/api/generated/model";
import { FieldHeader, dirtyFieldClass, labelTextWithHint } from "@/components/field-label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";

export const Route = createFileRoute("/_shell/admin/$slug/home/leaderboard")({
  component: LeaderboardConfigPage,
});

function LeaderboardConfigPage() {
  const { data: config, isLoading, isError } = useGetLeaderboardConfig();

  return (
    <>
      <PageHeader
        eyebrow="Home section"
        title="Leaderboard"
        description="The leaderboard ranks members by points (computed automatically). Configure how the list collapses/expands on the public page."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load config.</p>}
      {config && <LeaderboardConfigForm config={config} />}
    </>
  );
}

function LeaderboardConfigForm({ config }: { config: LeaderboardConfigResponseDto }) {
  const queryClient = useQueryClient();
  const mutation = useUpdateLeaderboardConfig({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetLeaderboardConfigQueryKey() });
        toast.success("Leaderboard config saved");
      },
      onError: () => toast.error("Failed to save config"),
    },
  });

  const [topExpandedCount, setTopExpandedCount] = useState(config.topExpandedCount);
  const [visibleUserCount, setVisibleUserCount] = useState(config.visibleUserCount);
  const [expandedByDefault, setExpandedByDefault] = useState(config.expandedByDefault);

  const changed = {
    topExpandedCount: topExpandedCount !== config.topExpandedCount,
    visibleUserCount: visibleUserCount !== config.visibleUserCount,
    expandedByDefault: expandedByDefault !== config.expandedByDefault,
  };
  const dirty = Object.values(changed).some(Boolean);
  useUnsavedGuard(dirty);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ data: { topExpandedCount, visibleUserCount, expandedByDefault } });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <div className="grid gap-4">
        <div>
          <FieldHeader
            htmlFor="lb-top"
            label={labelTextWithHint(
              "Top shown when collapsed",
              changed.topExpandedCount,
              "Rows fans see before clicking “Show more” (1–10).",
            )}
          />
          <Input
            id="lb-top"
            type="number"
            min={1}
            max={10}
            value={topExpandedCount}
            className={dirtyFieldClass(changed.topExpandedCount)}
            onChange={(e) => setTopExpandedCount(Number(e.target.value))}
          />
        </div>

        <div>
          <FieldHeader
            htmlFor="lb-visible"
            label={labelTextWithHint(
              "Full size when expanded",
              changed.visibleUserCount,
              "Max rows after “Show more” (10–50).",
            )}
          />
          <Input
            id="lb-visible"
            type="number"
            min={10}
            max={50}
            value={visibleUserCount}
            className={dirtyFieldClass(changed.visibleUserCount)}
            onChange={(e) => setVisibleUserCount(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="lb-expanded"
            checked={expandedByDefault}
            onCheckedChange={(v) => setExpandedByDefault(v === true)}
          />
          <Label htmlFor="lb-expanded">
            {labelTextWithHint(
              "Expanded by default",
              changed.expandedByDefault,
              "Open the full list on first view instead of collapsed.",
            )}
          </Label>
        </div>

        <div>
          <Button type="submit" disabled={!dirty || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
