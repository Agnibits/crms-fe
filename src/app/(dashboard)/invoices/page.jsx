"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, FileText, Plus, Wallet, TrendingUp } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/tables/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTableState } from "@/hooks/useTableState";
import { invoiceHooks } from "@/features/invoices/hooks";
import { INVOICE_STATUSES } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

const isOverdue = (inv) =>
  (inv?.balance ?? 0) > 0 &&
  (inv?.status === "overdue" ||
    (inv?.dueDate && new Date(inv.dueDate).getTime() < Date.now()));

export default function InvoicesPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = invoiceHooks.useList(t.queryParams);

  // Wide slice for the summary cards (independent of table pagination/filters).
  const summary = invoiceHooks.useList({ limit: 100 });

  const stats = useMemo(() => {
    const items = summary.data?.items ?? [];
    return {
      invoiced: items.reduce((acc, inv) => acc + (inv.total ?? 0), 0),
      collected: items.reduce((acc, inv) => acc + (inv.amountPaid ?? 0), 0),
      outstanding: items.reduce((acc, inv) => acc + (inv.balance ?? 0), 0),
      overdueCount: items.filter(isOverdue).length,
    };
  }, [summary.data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "number",
        header: "Invoice #",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.number}</span>
        ),
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge value={row.original.status} options={INVOICE_STATUSES} />
        ),
      },
      {
        accessorKey: "total",
        header: () => <span className="block text-right">Total</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrency(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "amountPaid",
        header: () => <span className="block text-right">Paid</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrency(row.original.amountPaid)}
          </span>
        ),
      },
      {
        accessorKey: "balance",
        header: () => <span className="block text-right">Balance</span>,
        cell: ({ row }) => (
          <span
            className={cn(
              "block text-right tabular-nums",
              (row.original.balance ?? 0) > 0 && "font-medium"
            )}
          >
            {formatCurrency(row.original.balance)}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => (
          <span
            className={cn(
              isOverdue(row.original) && "font-medium text-red-600 dark:text-red-400"
            )}
          >
            {formatDate(row.original.dueDate)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Track billing, collections and outstanding balances."
        actions={
          <Button onClick={() => router.push("/invoices/new")}>
            <Plus /> Add Invoice
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(stats.invoiced)}
          icon={FileText}
          hint="across recent invoices"
          loading={summary.isPending}
          index={0}
        />
        <StatCard
          title="Collected"
          value={formatCurrency(stats.collected)}
          icon={Wallet}
          hint="payments received"
          loading={summary.isPending}
          index={1}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={TrendingUp}
          hint="balance yet to collect"
          loading={summary.isPending}
          index={2}
        />
        <StatCard
          title="Overdue"
          value={String(stats.overdueCount)}
          icon={AlertTriangle}
          hint="invoices past due date"
          loading={summary.isPending}
          index={3}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isPending}
        error={error}
        onRetry={refetch}
        pageCount={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        {...t.tableProps}
        searchPlaceholder="Search invoices…"
        onRowClick={(row) => router.push(`/invoices/${row.id}`)}
        emptyTitle="No invoices found"
        emptyDescription="Invoices will appear here once orders are billed."
        toolbar={
          <Select
            value={t.filters.status ?? "all"}
            onValueChange={(v) => t.setFilter("status", v)}
          >
            <SelectTrigger className="w-[170px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {INVOICE_STATUSES.map((s) => (
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
              exportToCsv(data?.items ?? [], "invoices.csv", [
                { key: "number", label: "Invoice #" },
                { key: "customerName", label: "Customer" },
                { key: "status", label: "Status" },
                { key: "total", label: "Total" },
                { key: "amountPaid", label: "Amount Paid" },
                { key: "balance", label: "Balance" },
                { key: "dueDate", label: "Due Date" },
              ])
            }
          >
            <Download /> Export
          </Button>
        }
      />
    </div>
  );
}
