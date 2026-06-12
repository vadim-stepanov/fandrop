import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { TransactionEntry, TransactionKind } from "@/lib/artist";

import { TxHistoryTimestamp } from "./tx-history-timestamp";

const KIND_LABEL: Record<TransactionKind, string> = {
  WELCOME_BONUS: "Welcome Bonus",
  REFERRAL_REWARD: "Points Earned",
  PURCHASE_REWARD: "Points Earned",
  POINTS_SPEND: "Points Spent",
  ADMIN_ADJUSTMENT: "Admin",
  QUEST_REWARD: "Points Earned",
};

const KIND_PILL_CLASS: Record<TransactionKind, string> = {
  WELCOME_BONUS: "bg-emerald-500/15 text-emerald-600",
  REFERRAL_REWARD: "bg-emerald-500/15 text-emerald-600",
  PURCHASE_REWARD: "bg-emerald-500/15 text-emerald-600",
  POINTS_SPEND: "bg-primary/15 text-primary",
  ADMIN_ADJUSTMENT: "bg-muted text-muted-foreground",
  QUEST_REWARD: "bg-emerald-500/15 text-emerald-600",
};

function pageHref(slug: string, p: number): string {
  return p === 1 ? `/artist/${slug}/profile` : `/artist/${slug}/profile?txPage=${p}`;
}

export function ProfileTransactionHistory({
  artistSlug,
  entries,
  page,
  totalPages,
}: {
  artistSlug: string;
  entries: TransactionEntry[];
  page: number;
  totalPages: number;
}) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showPagination = totalPages > 1;

  const navIcon =
    "inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-card";
  const navIconDisabled =
    "inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground/40";
  const numBtnBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition";
  const numBtnActive = "border-primary bg-primary text-primary-foreground";
  const numBtnIdle = "border-border bg-background text-foreground hover:bg-card";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Transaction History</h2>
        {totalPages > 0 ? (
          <span className="mr-1 text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {entries.map((entry) => {
            const description = entry.description ?? KIND_LABEL[entry.kind];
            const pointsPositive = entry.amount > 0;
            return (
              <div key={entry.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold ${KIND_PILL_CLASS[entry.kind]}`}
                  >
                    {KIND_LABEL[entry.kind]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{description}</p>
                    <p className="text-xs text-muted-foreground">
                      <TxHistoryTimestamp date={entry.createdAt} />
                    </p>
                  </div>
                </div>
                {entry.amount !== 0 ? (
                  <span
                    className={`whitespace-nowrap font-heading text-sm font-bold ${
                      pointsPositive ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {pointsPositive ? "+" : ""}
                    {entry.amount.toLocaleString("en-US")} pts
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : page > 1 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          <span>No transactions on this page.</span>
          <Link
            href={pageHref(artistSlug, 1)}
            scroll={false}
            className="inline-flex rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-card"
          >
            Back to first page
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          No transactions yet. Buy something in the store to see activity here.
        </div>
      )}

      {showPagination && entries.length > 0 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          {hasPrev ? (
            <Link
              href={pageHref(artistSlug, page - 1)}
              scroll={false}
              aria-label="Previous page"
              className={navIcon}
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <div className={navIconDisabled} aria-hidden="true">
              <ChevronLeft className="size-4" />
            </div>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === page;
            return isActive ? (
              <span key={p} aria-current="page" className={`${numBtnBase} ${numBtnActive}`}>
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={pageHref(artistSlug, p)}
                scroll={false}
                className={`${numBtnBase} ${numBtnIdle}`}
              >
                {p}
              </Link>
            );
          })}

          {hasNext ? (
            <Link
              href={pageHref(artistSlug, page + 1)}
              scroll={false}
              aria-label="Next page"
              className={navIcon}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <div className={navIconDisabled} aria-hidden="true">
              <ChevronRight className="size-4" />
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
