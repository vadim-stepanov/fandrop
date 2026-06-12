import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Package,
  PackagePlus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getListMemberQuestsQueryKey,
  getListUserInventoryQueryKey,
  getListUserTransactionsQueryKey,
  getListUsersQueryKey,
  useAdjustUserPoints,
  useClaimMemberQuest,
  useDeleteUser,
  useDeleteUserInventory,
  useGrantUserInventory,
  useHideAllUserTransactions,
  useHideUserTransaction,
  useListMemberQuests,
  useListUserInventory,
  useListUserTransactions,
  useListUsers,
  useSetMemberQuestStatus,
} from "@/api/generated/users/users";
import { useListStoreItems } from "@/api/generated/store/store";
import type {
  AdminUserResponseDto,
  MemberQuestResponseDto,
  StoreItemResponseDto,
  TransactionEntryDtoKind,
} from "@/api/generated/model";
import { DataTable } from "@/components/data-table";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";
import { useConfirm } from "@/components/feedback/confirm-dialog-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin/$slug/users")({
  component: UsersPage,
});

function num(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

function formatItemPrice(item: StoreItemResponseDto): string {
  if (item.priceMode === "POINTS") {
    return item.pointsPrice != null ? `${num(item.pointsPrice)} pts` : "—";
  }
  if (item.priceAmountCents == null) {
    return "—";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: item.currencyCode || "USD",
    }).format(item.priceAmountCents / 100);
  } catch {
    return `${(item.priceAmountCents / 100).toFixed(2)} ${item.currencyCode ?? ""}`;
  }
}

const TX_KIND_LABEL: Record<TransactionEntryDtoKind, string> = {
  WELCOME_BONUS: "Welcome Bonus",
  REFERRAL_REWARD: "Points Earned",
  PURCHASE_REWARD: "Points Earned",
  POINTS_SPEND: "Points Spent",
  SOCIAL_CONNECT: "Points Earned",
  ADMIN_ADJUSTMENT: "Admin",
  QUEST_REWARD: "Points Earned",
};

function UsersPage() {
  const { data: users, isLoading, isError } = useListUsers();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [txUserId, setTxUserId] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [manageUserId, setManageUserId] = useState<string | null>(null);
  const [questsUserId, setQuestsUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success("User data wiped");
      },
      onError: () => toast.error("Failed to wipe user"),
    },
  });

  async function handleWipe(user: AdminUserResponseDto) {
    const ok = await confirm({
      title: `Wipe user data for ${user.email}?`,
      description:
        "Deletes this member on the artist — their points, transactions, inventory and social connections. Their global account is preserved (they can re-join fresh). Cannot be undone.",
      confirmLabel: "Wipe user data",
      destructive: true,
    });
    if (ok) {
      deleteMutation.mutate({ id: user.id });
    }
  }

  const columns = useMemo<ColumnDef<AdminUserResponseDto>[]>(
    () => [
      {
        id: "user",
        accessorKey: "email",
        header: "User",
        size: 280,
        cell: ({ row }) => {
          const { email, avatarUrl } = row.original;
          const initial = (email[0] ?? "?").toUpperCase();
          const name = email.split("@")[0] || email;
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">{name}</span>
                  {row.original.role === "ARTIST_ADMIN" ? (
                    <span className="shrink-0 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Admin
                    </span>
                  ) : null}
                </div>
                <span className="truncate font-mono text-xs text-muted-foreground">{email}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Points",
        size: 110,
        cell: ({ row }) => <span className="tabular-nums">{num(row.original.balance)}</span>,
      },
      {
        accessorKey: "totalEarned",
        header: "Earned",
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {num(row.original.totalEarned)}
          </span>
        ),
      },
      {
        accessorKey: "inventoryCount",
        header: "Inventory",
        size: 100,
        cell: ({ row }) => <span className="tabular-nums">{row.original.inventoryCount}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        size: 140,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "referredByEmail",
        header: "Referred by",
        size: 180,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.referredByEmail ? (
            <span className="truncate text-xs text-muted-foreground">
              {row.original.referredByEmail}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const actions: RowAction[] = [
            { label: "Adjust points", icon: Wallet, onClick: () => setAdjustingId(user.id) },
            { label: "Grant inventory", icon: PackagePlus, onClick: () => setGrantUserId(user.id) },
            { label: "Manage inventory", icon: Package, onClick: () => setManageUserId(user.id) },
            { label: "Manage quests", icon: Target, onClick: () => setQuestsUserId(user.id) },
            { label: "View transactions", icon: History, onClick: () => setTxUserId(user.id) },
          ];
          if (user.role !== "ARTIST_ADMIN") {
            actions.push({
              label: "Wipe user data",
              icon: Trash2,
              destructive: true,
              separatorBefore: true,
              onClick: () => void handleWipe(user),
            });
          }
          return (
            <div className="flex justify-end">
              <RowActionsMenu actions={actions} />
            </div>
          );
        },
      },
    ],
    // handlers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const adjustingUser = users?.find((u) => u.id === adjustingId) ?? null;
  const txUser = users?.find((u) => u.id === txUserId) ?? null;
  const grantUser = users?.find((u) => u.id === grantUserId) ?? null;
  const manageUser = users?.find((u) => u.id === manageUserId) ?? null;
  const questsUser = users?.find((u) => u.id === questsUserId) ?? null;

  return (
    <div className="pb-12">
      <PageHeader
        title="Users"
        description="Members of this artist. Adjust points or remove test accounts."
      />

      <p className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{users?.length ?? 0}</span> members
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load members.</p>}

      {users && (
        <DataTable
          columns={columns}
          data={users}
          enableResize
          storageKey="admin-users"
          pinFirstColumn
          pinLastColumn
          pageSize={20}
          emptyMessage="No members yet."
        />
      )}

      {adjustingUser && (
        <AdjustPointsDialog
          user={adjustingUser}
          open={adjustingId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setAdjustingId(null);
            }
          }}
        />
      )}

      {txUser && (
        <TxHistoryDialog
          user={txUser}
          open={txUserId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setTxUserId(null);
            }
          }}
        />
      )}

      {grantUser && (
        <GrantInventoryDialog
          user={grantUser}
          open={grantUserId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setGrantUserId(null);
            }
          }}
        />
      )}

      {manageUser && (
        <ManageInventoryDialog
          user={manageUser}
          open={manageUserId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setManageUserId(null);
            }
          }}
        />
      )}

      {questsUser && (
        <ManageQuestsDialog
          user={questsUser}
          open={questsUserId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setQuestsUserId(null);
            }
          }}
        />
      )}
    </div>
  );
}

function QuestStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    NOT_STARTED: "bg-zinc-100 text-zinc-600",
    IN_PROGRESS: "bg-sky-100 text-sky-700",
    COMPLETED: "bg-amber-100 text-amber-700",
    CLAIMED: "bg-green-100 text-green-700",
  };
  const label: Record<string, string> = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Reward unclaimed",
    CLAIMED: "Claimed",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label[status] ?? status}
    </span>
  );
}

function ManageQuestsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: quests, isLoading } = useListMemberQuests(user.id);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: getListMemberQuestsQueryKey(user.id) });
  };

  const setStatus = useSetMemberQuestStatus({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Quest status updated");
      },
      onError: () => toast.error("Failed to update status"),
    },
  });
  const claim = useClaimMemberQuest({
    mutation: {
      onSuccess: () => {
        invalidate();
        // Claim credits points → the member's balance row changes.
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success("Reward claimed for the member");
      },
      onError: () => toast.error("Failed to claim"),
    },
  });

  const pending = setStatus.isPending || claim.isPending;
  const list: MemberQuestResponseDto[] = quests ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quests</DialogTitle>
          <DialogDescription>
            {user.email} — toggle a quest done/undone, or claim its reward for the member. Resetting
            a claimed quest keeps the points already credited.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No quests yet.
            </p>
          ) : (
            <div className="grid max-h-[60vh] gap-1.5 overflow-y-auto pr-1">
              {list.map((quest) => (
                <div
                  key={quest.questId}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{quest.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {quest.rewardPoints.toLocaleString("en-US")} pts
                    </p>
                  </div>
                  <QuestStatusPill status={quest.status} />
                  <div className="flex shrink-0 gap-1.5">
                    {quest.status === "NOT_STARTED" || quest.status === "IN_PROGRESS" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          setStatus.mutate({
                            id: user.id,
                            questId: quest.questId,
                            data: { status: "COMPLETED" },
                          })
                        }
                      >
                        Complete
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          setStatus.mutate({
                            id: user.id,
                            questId: quest.questId,
                            data: { status: "NOT_STARTED" },
                          })
                        }
                      >
                        Undo
                      </Button>
                    )}
                    {quest.status === "COMPLETED" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => claim.mutate({ id: user.id, questId: quest.questId })}
                      >
                        Claim
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustPointsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useAdjustUserPoints({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success("Points updated");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to adjust points"),
    },
  });

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const amountNumber = Number(amount);
  const isValid = amount.trim() !== "" && Number.isInteger(amountNumber) && amountNumber !== 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    const reason = description.trim();
    mutation.mutate({
      id: user.id,
      data: { amount: amountNumber, description: reason || undefined },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust points</DialogTitle>
            <DialogDescription>
              {user.email} · current balance{" "}
              <span className="font-medium text-foreground">{num(user.balance)}</span> pts. Negative
              amounts deduct.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="adjust-amount" className="mb-1">
                Amount
              </Label>
              <Input
                id="adjust-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 250 or -100"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="adjust-reason" className="mb-1">
                Reason (optional)
              </Label>
              <Input
                id="adjust-reason"
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown in the member's transaction history"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TxHistoryDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading, isFetching, isError } = useListUserTransactions(
    user.id,
    { page: String(page) },
    { query: { placeholderData: keepPreviousData } },
  );

  // Hiding never changes the balance, so the Users list needs no refetch — only
  // this dialog's own list.
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: getListUserTransactionsQueryKey(user.id) });

  const hideOne = useHideUserTransaction({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Removed from history");
      },
      onError: () => toast.error("Failed to remove"),
    },
  });
  const hideAll = useHideAllUserTransactions({
    mutation: {
      onSuccess: () => {
        setPage(1);
        invalidate();
        toast.success("History cleared");
      },
      onError: () => toast.error("Failed to clear history"),
    },
  });

  async function handleDeleteOne(txId: string) {
    const ok = await confirm({
      title: "Remove this transaction from history?",
      description:
        "It disappears from the history here and on the member's profile. The balance is NOT changed — use Adjust points for that. Cannot be undone.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) {
      hideOne.mutate({ id: user.id, txId });
    }
  }

  async function handleDeleteAll() {
    const ok = await confirm({
      title: `Clear all ${data?.totalCount ?? 0} transactions?`,
      description:
        "Removes every history row for this member (here and on their profile). The balance is NOT changed. Cannot be undone.",
      confirmLabel: "Clear all",
      destructive: true,
    });
    if (ok) {
      hideAll.mutate({ id: user.id });
    }
  }

  const entries = data?.entries ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;
  const busy = hideOne.isPending || hideAll.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transaction history</DialogTitle>
          <DialogDescription>
            {user.email} · balance{" "}
            <span className="font-medium text-foreground">{num(user.balance)}</span> pts. Removing a
            row hides it from history (here and on the profile) — the balance is not changed.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[260px]">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Failed to load transactions.
            </p>
          ) : entries.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No transactions for this member.
            </p>
          ) : (
            <div
              className={`overflow-hidden rounded-lg border transition-opacity ${
                isFetching ? "opacity-50" : ""
              }`}
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">When</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                        {formatDateTime(e.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-xs">{TX_KIND_LABEL[e.kind]}</td>
                      <td className="max-w-xs truncate px-3 py-2">
                        {e.description ?? TX_KIND_LABEL[e.kind]}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-xs tabular-nums ${
                          e.amount > 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {e.amount > 0 ? "+" : ""}
                        {num(e.amount)} pts
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          disabled={busy}
                          onClick={() => void handleDeleteOne(e.id)}
                          aria-label="Remove transaction"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {totalCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => void handleDeleteAll()}
            >
              {hideAll.isPending ? "Clearing…" : `Clear all (${totalCount})`}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GrantInventoryDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useListStoreItems();
  const visibleItems = useMemo(() => (items ?? []).filter((i) => i.isVisible), [items]);
  const [selectedId, setSelectedId] = useState("");

  const grant = useGrantUserInventory({
    mutation: {
      onSuccess: () => {
        // Inventory count on the Users row changes; balance/leaderboard don't.
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success("Item granted");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to grant item"),
    },
  });

  function handleGrant() {
    if (selectedId) {
      grant.mutate({ id: user.id, data: { storeItemId: selectedId } });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant inventory</DialogTitle>
          <DialogDescription>
            Give {user.email} a store item. No charge, no stock change, no points — the item just
            appears in their inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading store…</p>
          ) : visibleItems.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No visible store items. Add one in the Store first.
            </p>
          ) : (
            <div className="grid max-h-[50vh] gap-1.5 overflow-y-auto pr-1">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                    selectedId === item.id
                      ? "border-foreground bg-muted"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="grid size-10 shrink-0 place-items-center rounded bg-muted text-[10px] text-muted-foreground">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.quality.toLowerCase()} · {formatItemPrice(item)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!selectedId || grant.isPending} onClick={handleGrant}>
            {grant.isPending ? "Granting…" : "Grant item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageInventoryDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: items, isLoading } = useListUserInventory(user.id);

  const remove = useDeleteUserInventory({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListUserInventoryQueryKey(user.id) });
        // Inventory count on the Users row changes; balance/points don't.
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success("Item removed");
      },
      onError: () => toast.error("Failed to remove item"),
    },
  });

  async function handleRemove(itemId: string, title: string) {
    const ok = await confirm({
      title: `Remove "${title}" from inventory?`,
      description: "The member loses this item. Points are NOT refunded. Cannot be undone.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) {
      remove.mutate({ id: user.id, itemId });
    }
  }

  const list = items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventory</DialogTitle>
          <DialogDescription>
            {user.email} · {list.length} {list.length === 1 ? "item" : "items"}. Removing an item
            does not refund points.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No inventory items yet.
            </p>
          ) : (
            <div className="grid max-h-[60vh] gap-1.5 overflow-y-auto pr-1">
              {list.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-2">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="grid size-10 shrink-0 place-items-center rounded bg-muted text-[10px] text-muted-foreground">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.quality.toLowerCase()} · {formatDate(item.acquiredAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    disabled={remove.isPending}
                    onClick={() => void handleRemove(item.id, item.title)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
