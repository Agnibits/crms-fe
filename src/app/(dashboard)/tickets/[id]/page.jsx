"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Hash, RefreshCcw } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import UserAvatar from "@/components/common/UserAvatar";
import TicketChat from "@/features/tickets/TicketChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ticketHooks, useAgents } from "@/features/tickets/hooks";
import { TICKET_STATUSES, PRIORITIES } from "@/constants/options";
import { formatDateTime, formatRelative } from "@/utils/format";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: ticket, isPending, error, refetch } = ticketHooks.useDetail(id);
  const patch = ticketHooks.usePatch();
  const agents = useAgents();

  if (isPending) return <LoadingSpinner fullPage label="Loading ticket…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!ticket) return <ErrorState title="Ticket not found" onRetry={refetch} />;

  const assignee = (agents.data?.items ?? []).find((u) => u.id === ticket.assigneeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {ticket.subject}
            <StatusBadge value={ticket.status} options={TICKET_STATUSES} />
            <StatusBadge value={ticket.priority} options={PRIORITIES} />
          </span>
        }
        description={`${ticket.number} · opened ${formatRelative(ticket.createdAt)} by ${ticket.customerName}`}
        actions={
          <Button variant="ghost" onClick={() => router.push("/tickets")}>
            <ArrowLeft /> Back to tickets
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Conversation */}
        <TicketChat ticket={ticket} className="xl:col-span-2" />

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> Number
                </span>
                <span className="font-medium tabular-nums">{ticket.number}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Customer
                </span>
                <span className="max-w-[55%] truncate text-right font-medium">
                  {ticket.customerName}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Created
                </span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <RefreshCcw className="h-3.5 w-3.5" /> Updated
                </span>
                <span>{formatRelative(ticket.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Triage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-status">Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => patch.mutate({ id: ticket.id, status: v })}
                  disabled={patch.isPending}
                >
                  <SelectTrigger id="ticket-status" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => patch.mutate({ id: ticket.id, priority: v })}
                  disabled={patch.isPending}
                >
                  <SelectTrigger id="ticket-priority" className="w-full">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Assignee</CardTitle>
            </CardHeader>
            <CardContent>
              {assignee ? (
                <div className="flex items-center gap-3">
                  <UserAvatar name={assignee.name} src={assignee.avatar} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{assignee.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {assignee.email || assignee.department || "Support"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {ticket.assigneeId ? "Support agent" : "Unassigned"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
