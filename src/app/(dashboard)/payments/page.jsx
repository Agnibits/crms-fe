"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, HandCoins, Plus, Wallet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
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
import { paymentHooks } from "@/features/payments/hooks";
import RecordPaymentDialog from "@/features/payments/RecordPaymentDialog";
import { PAYMENT_METHODS, findOption } from "@/constants/options";
import { exportToCsv } from "@/utils/export";
import { formatCurrency, formatDate } from "@/utils/format";

export default function PaymentsPage() {
  const router = useRouter();
  const t = useTableState();
  const [recordOpen, setRecordOpen] = useState(false);

  const { data, isPending, error, refetch } = paymentHooks.useList(t.queryParams);

  // Wide slice for the summary cards (independent of table pagination/filters).
  const summary = paymentHooks.useList({ limit: 100 });

  const stats = useMemo(() => {
    const items = summary.data?.items ?? [];
    const total = items.reduce((acc, p) => acc + (p.amount ?? 0), 0);
    const now = new Date();
    const thisMonth = items
      .filter((p) => {
        const d = p.paidAt ? new Date(p.paidAt) : null;
        return (
          d &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, p) => acc + (p.amount ?? 0), 0);
    return {
      total,
      thisMonth,
      avg: items.length ? total / items.length : 0,
    };
  }, [summary.data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "number",
        header: "Payment #",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.number ?? "—"}</span>
        ),
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice",
        cell: ({ row }) =>
          row.original.invoiceId ? (
            <Link
              href={`/invoices/${row.original.invoiceId}`}
              onClick={(e) => e.stopPropagation()}
              className="tabular-nums text-primary hover:underline"
            >
              {row.original.invoiceNumber}
            </Link>
          ) : (
            <span className="tabular-nums">{row.original.invoiceNumber ?? "—"}</span>
          ),
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "amount",
        header: () => <span className="block text-right">Amount</span>,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) =>
          findOption(PAYMENT_METHODS, row.original.method)?.label ??
          row.original.method ??
          "—",
      },
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.reference || "—"}</span>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Paid On",
        cell: ({ row }) => formatDate(row.original.paidAt),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="All payments received against customer invoices."
        actions={
          <Button onClick={() => setRecordOpen(true)}>
            <Plus /> Record Payment
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Collected"
          value={formatCurrency(stats.total)}
          icon={Wallet}
          hint="across recent payments"
          loading={summary.isPending}
          index={0}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.thisMonth)}
          icon={CalendarDays}
          hint="collected this month"
          loading={summary.isPending}
          index={1}
        />
        <StatCard
          title="Avg Payment"
          value={formatCurrency(stats.avg)}
          icon={HandCoins}
          hint="average per payment"
          loading={summary.isPending}
          index={2}
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
        searchPlaceholder="Search payments…"
        onRowClick={(row) => router.push(`/payments/${row.id}`)}
        emptyTitle="No payments found"
        emptyDescription="Record a payment against an invoice to see it here."
        toolbar={
          <Select
            value={t.filters.method ?? "all"}
            onValueChange={(v) => t.setFilter("method", v)}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by method">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportToCsv(data?.items ?? [], "payments.csv", [
                { key: "number", label: "Payment #" },
                { key: "invoiceNumber", label: "Invoice" },
                { key: "customerName", label: "Customer" },
                { key: "amount", label: "Amount" },
                { key: "method", label: "Method" },
                { key: "reference", label: "Reference" },
                { key: "paidAt", label: "Paid On" },
              ])
            }
          >
            <Download /> Export
          </Button>
        }
      />

      <RecordPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
}
