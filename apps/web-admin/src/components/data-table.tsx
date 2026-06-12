import {
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Shared TanStack-based admin DataTable. Covers the admin table requirements:
// column sorting, column resize (+ persist), row selection, horizontal scroll,
// column pinning (left/right). Pagination is opt-in (small lists skip it).
//
//   const columns: ColumnDef<MyRow>[] = [...];
//   <DataTable columns={columns} data={rows} pinLastColumn />

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];

  /** Pin the left column (sticky during horizontal scroll). */
  pinFirstColumn?: boolean;

  /** Pin the right column — keeps a trailing action column visible during
   *  horizontal scroll. */
  pinLastColumn?: boolean;

  /** Enable column-resize handles in the header. */
  enableResize?: boolean;

  /** Enable row-selection state (caller adds the checkbox column). */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  /** Enable pagination. If omitted — render everything. */
  pageSize?: number;

  className?: string;

  /** Message when `data.length === 0`. */
  emptyMessage?: string;

  /** Persist column widths in localStorage under this key (needs enableResize).
   *  Without a key — sizing is in-memory only. */
  storageKey?: string;

  /** Click any row → toggle a single-row highlight (visual anchor while
   *  scrolling horizontally). Reuses TanStack rowSelection (single mode). */
  enableRowHighlight?: boolean;

  /** Force the table to fit its container (`table-layout: fixed`, no h-scroll;
   *  columns honour declared `size`). Pair with `truncate` cells. Mutually
   *  exclusive with `enableResize`. */
  fitContainer?: boolean;

  /** Whole-row click handler (master-detail navigation). Sets cursor-pointer. */
  onRowClick?: (row: TData) => void;
};

const STORAGE_PREFIX = "fd-admin-table:";

function loadColumnSizing(storageKey: string | undefined): ColumnSizingState {
  if (!storageKey || typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as ColumnSizingState) : {};
  } catch {
    return {};
  }
}

function saveColumnSizing(storageKey: string | undefined, sizing: ColumnSizingState): void {
  if (!storageKey || typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(sizing));
  } catch {
    // localStorage may be quota-full / disabled — ignore.
  }
}

export function DataTable<TData>({
  columns,
  data,
  pinFirstColumn = false,
  pinLastColumn = false,
  enableResize = false,
  enableRowSelection = false,
  onRowSelectionChange,
  pageSize,
  className,
  emptyMessage = "No results.",
  storageKey,
  enableRowHighlight = false,
  fitContainer = false,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnPinning] = useState<ColumnPinningState>({
    ...(pinFirstColumn ? { left: [columns[0]?.id ?? ""].filter(Boolean) } : {}),
    ...(pinLastColumn ? { right: [columns[columns.length - 1]?.id ?? ""].filter(Boolean) } : {}),
  });
  // Initial = `{}` to match SSR (no localStorage on the server). Saved sizes
  // load only after mount — reading localStorage in the initializer would
  // diverge server/client trees (hydration mismatch). Trade-off: brief width
  // flicker on first render.
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // queueMicrotask wraps the setState per React 19's set-state-in-effect rule.
  useEffect(() => {
    queueMicrotask(() => {
      const stored = loadColumnSizing(storageKey);
      if (Object.keys(stored).length > 0) {
        setColumnSizing(stored);
      }
    });
  }, [storageKey]);

  useEffect(() => {
    queueMicrotask(() => saveColumnSizing(storageKey, columnSizing));
  }, [storageKey, columnSizing]);

  // TanStack's useReactTable returns functions React Compiler can't memoize;
  // we don't run the compiler, so skipping memoization here is safe.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting, rowSelection, columnPinning, columnSizing },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onRowSelectionChange?.(next);
    },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: pageSize ? { pagination: { pageSize } } : undefined,
    enableRowSelection: enableRowSelection || enableRowHighlight,
    enableMultiRowSelection: enableRowSelection,
    enableColumnResizing: enableResize,
    columnResizeMode: enableResize ? "onChange" : undefined,
  });

  // With resize, set total width as min-width on the <table> so resizing one
  // column grows the table past the wrapper (h-scroll) instead of squeezing
  // neighbours. table-layout: fixed locks widths so they're respected exactly.
  const totalTableWidth = enableResize ? table.getTotalSize() : undefined;

  return (
    <div className={cn("w-full", className)}>
      {/* max-h + overflow-auto gives internal vertical + horizontal scroll;
          this wrapper is the nearest scrolling ancestor so sticky <th> works. */}
      <div
        className={cn(
          "max-h-[640px] rounded-xl border border-zinc-200 bg-white shadow-sm",
          fitContainer ? "overflow-y-auto" : "overflow-auto",
        )}
      >
        {/* Raw <table> (not the ui <Table> wrapper, which adds its own
            overflow div and would break sticky-y on <th>). */}
        <table
          className="w-full caption-bottom text-sm"
          style={
            enableResize
              ? { minWidth: totalTableWidth, tableLayout: "fixed" }
              : fitContainer
                ? { tableLayout: "fixed" }
                : undefined
          }
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  const isPinnedLeft = header.column.getIsPinned() === "left";
                  const isPinnedRight = header.column.getIsPinned() === "right";
                  const colWidth = enableResize || fitContainer ? header.getSize() : undefined;
                  // Sticky on each <th> (not <thead> — border-collapse keeps
                  // thead from moving). box-shadow replaces the border that
                  // sticky drops.
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: colWidth,
                        position: "sticky",
                        top: 0,
                        zIndex: isPinnedLeft || isPinnedRight ? 30 : 20,
                        backgroundColor: "white",
                        boxShadow: isPinnedRight
                          ? "0 1px 0 0 rgb(228 228 231), -1px 0 0 0 rgb(228 228 231)"
                          : "0 1px 0 0 rgb(228 228 231)",
                        ...(isPinnedLeft ? { left: 0 } : {}),
                        ...(isPinnedRight ? { right: 0 } : {}),
                      }}
                      className="relative"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1.5",
                            canSort && "cursor-pointer select-none",
                          )}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort &&
                            (sortDir === "asc" ? (
                              <ChevronUp size={14} aria-hidden />
                            ) : sortDir === "desc" ? (
                              <ChevronDown size={14} aria-hidden />
                            ) : (
                              <ChevronsUpDown size={14} className="opacity-40" aria-hidden />
                            ))}
                        </div>
                      )}
                      {enableResize && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-zinc-300",
                            header.column.getIsResizing() && "bg-zinc-400",
                          )}
                          aria-hidden
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row.original)
                      : enableRowHighlight
                        ? () => row.toggleSelected(!row.getIsSelected())
                        : undefined
                  }
                  className={onRowClick || enableRowHighlight ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinnedLeft = cell.column.getIsPinned() === "left";
                    const isPinnedRight = cell.column.getIsPinned() === "right";
                    const cellWidth =
                      enableResize || fitContainer ? cell.column.getSize() : undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cellWidth,
                          ...(isPinnedLeft
                            ? {
                                position: "sticky",
                                left: 0,
                                zIndex: 1,
                                backgroundColor: "white",
                                boxShadow: "1px 0 0 0 rgb(228 228 231)",
                              }
                            : {}),
                          ...(isPinnedRight
                            ? {
                                position: "sticky",
                                right: 0,
                                zIndex: 1,
                                backgroundColor: "white",
                                boxShadow: "-1px 0 0 0 rgb(228 228 231)",
                              }
                            : {}),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>

      {pageSize && (
        <div className="mt-3 flex items-center justify-between text-sm text-zinc-600">
          <div>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length,
            )}{" "}
            of {data.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
