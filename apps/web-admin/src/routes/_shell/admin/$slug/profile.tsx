import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getGetReferralSettingsQueryKey,
  useGetReferralSettings,
  useUpdateReferralSettings,
} from "@/api/generated/referral/referral";
import {
  getListSocialLinksQueryKey,
  useDeleteSocialLink,
  useListSocialLinks,
} from "@/api/generated/social-links/social-links";
import type {
  ArtistSocialLinkResponseDto,
  ReferralSettingsResponseDto,
} from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { FieldHeader, dirtyFieldClass, labelTextWithHint } from "@/components/field-label";
import { AddSocialDialog } from "@/features/profile/add-social-dialog";
import { EditSocialDialog } from "@/features/profile/edit-social-dialog";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SOCIAL_LINKS_MAX } from "@/lib/admin/text-limits";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";

export const Route = createFileRoute("/_shell/admin/$slug/profile")({
  component: ProfilePage,
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

// The member-facing Profile page. Currently one block — Socials. Referral and
// identity blocks land here later (mirrors the public Profile composition).
function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Page"
        title="Profile"
        description="The member-facing profile page — social platforms fans can connect and the referral program."
      />
      <SocialsSection />
      <ReferralSection />
    </>
  );
}

function ReferralSection() {
  const { data: settings, isLoading, isError } = useGetReferralSettings();

  return (
    <section className="mt-10 space-y-4 border-t border-border pb-12 pt-8">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Referral</h2>
        <p className="text-sm text-muted-foreground">
          Reward members for inviting friends. When someone joins via a member&apos;s referral link,{" "}
          <span className="font-medium text-foreground">both</span> the inviter and the new member
          receive the reward points.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load referral settings.</p>}
      {settings && <ReferralSettingsForm settings={settings} />}
    </section>
  );
}

function ReferralSettingsForm({ settings }: { settings: ReferralSettingsResponseDto }) {
  const queryClient = useQueryClient();
  const mutation = useUpdateReferralSettings({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetReferralSettingsQueryKey() });
        toast.success("Referral settings saved");
      },
      onError: () => toast.error("Failed to save referral settings"),
    },
  });

  const [referralEnabled, setReferralEnabled] = useState(settings.referralEnabled);
  const [referralRewardPoints, setReferralRewardPoints] = useState(settings.referralRewardPoints);

  const changed = {
    referralEnabled: referralEnabled !== settings.referralEnabled,
    referralRewardPoints: referralRewardPoints !== settings.referralRewardPoints,
  };
  const dirty = Object.values(changed).some(Boolean);
  useUnsavedGuard(dirty);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ data: { referralEnabled, referralRewardPoints } });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="ref-enabled"
            checked={referralEnabled}
            onCheckedChange={(v) => setReferralEnabled(v === true)}
          />
          <Label htmlFor="ref-enabled">
            {labelTextWithHint(
              "Referral enabled",
              changed.referralEnabled,
              "Off → members don't see a referral block and links don't award points.",
            )}
          </Label>
        </div>

        <div>
          <FieldHeader
            htmlFor="ref-points"
            label={labelTextWithHint(
              "Reward points",
              changed.referralRewardPoints,
              "Points each side gets per successful referral (inviter + new member).",
            )}
          />
          <Input
            id="ref-points"
            type="number"
            min={0}
            max={100000}
            className={`w-40 ${dirtyFieldClass(changed.referralRewardPoints)}`}
            value={referralRewardPoints}
            onChange={(e) => setReferralRewardPoints(Number(e.target.value))}
          />
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

function SocialsSection() {
  const { data: links, isLoading, isError } = useListSocialLinks();
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useDeleteSocialLink({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListSocialLinksQueryKey() });
        toast.success("Social removed");
      },
      onError: () => toast.error("Failed to remove social"),
    },
  });

  async function handleDelete(link: ArtistSocialLinkResponseDto) {
    const ok = await confirm({
      title: `Remove ${link.socialPlatform.label}?`,
      description: "Members' existing connections to this platform are removed too.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: link.id });
    }
  }

  const columns = useMemo<ColumnDef<ArtistSocialLinkResponseDto>[]>(
    () => [
      {
        id: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <img
              src={`/brand-icons/${row.original.socialPlatform.icon}.svg`}
              alt=""
              className="size-5 shrink-0 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-medium">{row.original.socialPlatform.label}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.socialPlatform.slug}
              </span>
            </div>
          </div>
        ),
        size: 200,
      },
      {
        id: "connectBonus",
        accessorKey: "connectBonus",
        header: "Connect bonus",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            +{row.original.connectBonus.toLocaleString("en-US")}
          </span>
        ),
        size: 130,
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
              aria-label={`Edit ${row.original.socialPlatform.label}`}
              onClick={() => setEditingId(row.original.id)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${row.original.socialPlatform.label}`}
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
    // handlers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const nextSort = links?.length ? Math.max(...links.map((l) => l.sortOrder)) + 1 : 0;
  const existingPlatformIds = links?.map((l) => l.socialPlatform.id) ?? [];
  const editingLink = links?.find((l) => l.id === editingId) ?? null;

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Socials</h2>
        <p className="text-sm text-muted-foreground">
          Platforms members can connect on their profile (shown on Profile + leaderboard). Each
          grants its connect bonus once.
        </p>
      </div>

      {/* Count left / Add right above the table — consistent with the other tables. */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{links?.length ?? 0}</span> /{" "}
          {SOCIAL_LINKS_MAX} platforms
        </p>
        <AddSocialDialog
          existingPlatformIds={existingPlatformIds}
          linkCount={links?.length ?? 0}
          nextSort={nextSort}
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load socials.</p>}

      {links && (
        <DataTable
          columns={columns}
          data={links}
          fitContainer
          emptyMessage="No social platforms yet. Click “Add social” to add the first one."
        />
      )}

      {editingLink && (
        <EditSocialDialog
          link={editingLink}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
            }
          }}
        />
      )}
    </section>
  );
}
