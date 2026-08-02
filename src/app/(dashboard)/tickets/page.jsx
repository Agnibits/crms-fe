"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Inbox, LifeBuoy, Mail, Plus, Ticket } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableState } from "@/hooks/useTableState";
import DepartmentFilter from "@/features/departments/DepartmentFilter";
import { ticketHooks } from "@/features/tickets/hooks";
import { useEmailChannels } from "@/features/email/hooks";
import NewTicketDialog from "@/features/tickets/NewTicketDialog";
import { TICKET_STATUSES, PRIORITIES } from "@/constants/options";
import { formatNumber, formatRelative } from "@/utils/format";

export default function TicketsPage() {
  const router = useRouter();
  // Landing here from a department's page arrives pre-filtered to its queue.
  const departmentId = useSearchParams().get("departmentId");
  const t = useTableState({ initialFilters: departmentId ? { departmentId } : {} });
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending, error, refetch } = ticketHooks.useList(t.queryParams);
  const stats = ticketHooks.useList({ limit: 1000 });
  // A support mailbox = a channel that receives (IMAP) AND auto-creates tickets.
  const { data: channels = [], isPending: channelsPending } = useEmailChannels();
  const hasSupportMailbox = channels.some((c) => c.autoCreateTickets && c.imapHost);

  const kpis = useMemo(() => {
    const items = stats.data?.items ?? [];
    return {
      open: items.filter((tk) => tk.status === "open").length,
      inProgress: items.filter((tk) => tk.status === "in_progress").length,
      resolved: items.filter((tk) => tk.status === "resolved").length,
      total: items.length,
    };
  }, [stats.data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "number",
        header: "Ticket",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.number}</span>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="block max-w-[280px] truncate">{row.original.subject}</span>
        ),
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => row.original.department?.name || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge value={row.original.status} options={TICKET_STATUSES} />
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <StatusBadge value={row.original.priority} options={PRIORITIES} />,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatRelative(row.original.updatedAt)}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Track, prioritize and resolve customer support requests."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        }
      />

      {!channelsPending && !hasSupportMailbox && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Turn customer emails into tickets automatically</p>
              <p className="text-sm text-muted-foreground">
                Connect a dedicated support mailbox (e.g. support@yourcompany.com). Every email to
                it opens a ticket here, and your replies go back out from that same address.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => router.push("/settings/email")}
          >
            <Mail className="h-4 w-4" /> Connect support mailbox
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open"
          value={formatNumber(kpis.open)}
          icon={Inbox}
          hint="awaiting first response"
          loading={stats.isPending}
          index={0}
        />
        <StatCard
          title="In Progress"
          value={formatNumber(kpis.inProgress)}
          icon={Clock}
          hint="being worked on"
          loading={stats.isPending}
          index={1}
        />
        <StatCard
          title="Resolved"
          value={formatNumber(kpis.resolved)}
          icon={CheckCircle2}
          hint="awaiting confirmation"
          loading={stats.isPending}
          index={2}
        />
        <StatCard
          title="Total Tickets"
          value={formatNumber(kpis.total)}
          icon={Ticket}
          hint="all time"
          loading={stats.isPending}
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
        searchPlaceholder="Search tickets…"
        onRowClick={(row) => router.push(`/tickets/${row.id}`)}
        emptyTitle="No tickets found"
        emptyDescription="All caught up — no support tickets match your filters."
        toolbar={
          <>
            <Select
              value={t.filters.status ?? "all"}
              onValueChange={(v) => t.setFilter("status", v)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TICKET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={t.filters.priority ?? "all"}
              onValueChange={(v) => t.setFilter("priority", v)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DepartmentFilter
              value={t.filters.departmentId}
              onChange={(v) => t.setFilter("departmentId", v)}
            />
          </>
        }
      />

      <NewTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
