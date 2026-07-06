"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { PAGE_SIZE_OPTIONS } from "@/constants/app";
import { cn } from "@/utils/cn";

/** Row-selection checkbox column — spread into your column defs. */
export const selectionColumn = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all rows"
      className="translate-y-[2px]"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  ),
  enableSorting: false,
  size: 32,
};

/**
 * Server-driven data table: pagination, sorting and search are controlled
 * by the parent (usually via useTableState + a React Query list hook).
 */
export default function DataTable({
  columns,
  data = [],
  loading = false,
  error = null,
  onRetry,
  // server state
  pageCount = 1,
  total = 0,
  pagination,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  // toolbar
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  toolbar,           // extra filter controls (left side)
  actions,           // buttons (right side): export, add, import…
  bulkActions,       // (selectedRows, clearSelection) => ReactNode
  // behavior
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
}) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, rowSelection: rowSelection ?? {} },
    manualPagination: true,
    manualSorting: true,
    pageCount,
    enableRowSelection,
    onSortingChange,
    onPaginationChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => row.id ?? String(index),
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const pageIndex = pagination?.pageIndex ?? 0;
  const pageSize = pagination?.pageSize ?? 10;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                aria-label="Search table"
              />
            </div>
          )}
          {toolbar}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Toggle columns">
                <Columns3 />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    className="capitalize"
                  >
                    {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk actions bar */}
      {enableRowSelection && selectedRows.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/60 px-3 py-2">
          <p className="text-sm font-medium">{selectedRows.length} selected</p>
          <div className="flex items-center gap-2">
            {bulkActions?.(selectedRows, () => table.resetRowSelection())}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card">
        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0">
                    <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(onRowClick && "cursor-pointer")}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!error && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `Showing ${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} of ${total}`
              : "No results"}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) =>
                  onPaginationChange?.((old) => ({ pageIndex: 0, pageSize: Number(v) }))
                }
              >
                <SelectTrigger className="h-8 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.setPageIndex(0)}
                disabled={pageIndex === 0}
                aria-label="First page"
              >
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={pageIndex === 0}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <span className="px-2 text-sm tabular-nums">
                {pageIndex + 1} / {Math.max(1, pageCount)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={pageIndex + 1 >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={pageIndex + 1 >= pageCount}
                aria-label="Last page"
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
