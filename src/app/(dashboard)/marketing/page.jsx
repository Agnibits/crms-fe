"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Mail,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  MousePointerClick,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/tables/DataTable";
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
import { campaignHooks } from "@/features/campaigns/hooks";
import { CAMPAIGN_STATUSES } from "@/constants/options";
import { formatDate, formatNumber, formatPercent } from "@/utils/format";

export default function MarketingPage() {
  const router = useRouter();
  const t = useTableState();
  const { data, isPending, error, refetch } = campaignHooks.useList(t.queryParams);
  const stats = campaignHooks.useList({ limit: 1000 });
  const remove = campaignHooks.useRemove();
  const [deleteId, setDeleteId] = useState(null);

  const kpis = useMemo(() => {
    const items = stats.data?.items ?? [];
    const emails = items.filter((c) => c.type === "email");
    const emailsSent = emails.reduce((acc, c) => acc + (c.sent || 0), 0);
    const totalSent = items.reduce((acc, c) => acc + (c.sent || 0), 0);
    const totalOpened = items.reduce((acc, c) => acc + (c.opened || 0), 0);
    const totalClicked = items.reduce((acc, c) => acc + (c.clicked || 0), 0);
    return {
      total: items.length,
      emailsSent,
      openRate: totalSent ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent ? (totalClicked / totalSent) * 100 : 0,
    };
  }, [stats.data]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Campaign",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const isEmail = row.original.type === "email";
          const Icon = isEmail ? Mail : MessageSquare;
          return (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {isEmail ? "Email" : "SMS"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge value={row.original.status} options={CAMPAIGN_STATUSES} />
        ),
      },
      { accessorKey: "audience", header: "Audience" },
      {
        accessorKey: "sent",
        header: "Sent",
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{formatNumber(row.original.sent)}</span>
        ),
      },
      {
        accessorKey: "opened",
        header: "Opened",
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{formatNumber(row.original.opened)}</span>
        ),
      },
      {
        accessorKey: "clicked",
        header: "Clicked",
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{formatNumber(row.original.clicked)}</span>
        ),
      },
      {
        accessorKey: "scheduledAt",
        header: "Scheduled",
        cell: ({ row }) => formatDate(row.original.scheduledAt),
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
                aria-label="Campaign actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/marketing/${row.original.id}`)}>
                <Eye /> View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description="Create, schedule and track email & SMS campaigns."
        actions={
          <Button onClick={() => router.push("/marketing/new")}>
            <Plus /> New Campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Campaigns"
          value={formatNumber(kpis.total)}
          icon={Megaphone}
          hint="across all channels"
          loading={stats.isPending}
          index={0}
        />
        <StatCard
          title="Emails Sent"
          value={formatNumber(kpis.emailsSent)}
          icon={Send}
          hint="email campaigns only"
          loading={stats.isPending}
          index={1}
        />
        <StatCard
          title="Avg Open Rate"
          value={formatPercent(kpis.openRate)}
          icon={Eye}
          hint="opened / sent"
          loading={stats.isPending}
          index={2}
        />
        <StatCard
          title="Avg Click Rate"
          value={formatPercent(kpis.clickRate)}
          icon={MousePointerClick}
          hint="clicked / sent"
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
        searchPlaceholder="Search campaigns…"
        onRowClick={(row) => router.push(`/marketing/${row.id}`)}
        emptyTitle="No campaigns found"
        emptyDescription="Create your first campaign to start reaching your audience."
        toolbar={
          <Select
            value={t.filters.status ?? "all"}
            onValueChange={(v) => t.setFilter("status", v)}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CAMPAIGN_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        destructive
        title="Delete campaign?"
        description="This campaign and its stats will be permanently removed."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
}
