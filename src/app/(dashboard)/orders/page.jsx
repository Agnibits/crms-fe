"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { selectionColumn } from "@/components/tables/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableState } from "@/hooks/useTableState";
import { orderHooks } from "@/features/orders/hooks";
import { ORDER_STATUSES, BADGE_COLORS, findOption } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

/** Inline, optimistic status select rendered in each row. */
function RowStatusSelect({ order, patch }) {
  const option = findOption(ORDER_STATUSES, order.status);
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={order.status}
        onValueChange={(status) => patch.mutate({ id: order.id, status })}
      >
        <SelectTrigger
          aria-label={`Status for ${order.number}`}
          className={cn(
            "h-7 w-[130px] rounded-full border px-2.5 text-xs font-medium",
            BADGE_COLORS[option?.color] || BADGE_COLORS.gray
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = orderHooks.useList(t.queryParams);
  const patch = orderHooks.usePatch();
  const remove = orderHooks.useRemove();
  const bulkRemove = orderHooks.useBulkRemove();
  const [deleteId, setDeleteId] = useState(null);

  const columns = useMemo(
    () => [
      selectionColumn,
      {
        accessorKey: "number",
        header: "Number",
        cell: ({ row }) => <span className="font-medium">{row.original.number}</span>,
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <RowStatusSelect order={row.original} patch={patch} />,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="text-right tabular-nums">{formatCurrency(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Row actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/orders/${row.original.id}`)}>
                <Eye className="h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, patch]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        description="Track confirmed orders from quote to delivery."
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isPending}
        error={error}
        onRetry={refetch}
        pageCount={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        {...t.tableProps}
        enableRowSelection
        searchPlaceholder="Search orders…"
        onRowClick={(row) => router.push(`/orders/${row.id}`)}
        emptyTitle="No orders found"
        emptyDescription="Orders appear here when quotes are converted."
        toolbar={
          <Select
            value={t.filters.status ?? "all"}
            onValueChange={(v) => t.setFilter("status", v)}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportToCsv(data?.items ?? [], "orders.csv", [
                { key: "number", label: "Number" },
                { key: "customerName", label: "Customer" },
                { key: "status", label: "Status" },
                { key: "subtotal", label: "Subtotal" },
                { key: "tax", label: "Tax" },
                { key: "total", label: "Total" },
                { key: "quoteId", label: "Quote ID" },
                { key: "createdAt", label: "Created" },
              ])
            }
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        }
        bulkActions={(rows, clear) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkRemove.mutate(rows.map((r) => r.id), { onSuccess: clear })}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete order?"
        description="This order will be permanently removed."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
