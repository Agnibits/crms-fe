"use client";

import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  LifeBuoy,
  Network,
  UserCog,
  Users,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import UserAvatar from "@/components/common/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranchOptions } from "@/features/branches/hooks";
import {
  useDepartment,
  useDepartmentMembers,
  useDepartmentTickets,
} from "@/features/departments/hooks";
import { BACKEND_ROLE_LABELS } from "@/constants/roles";
import { TICKET_STATUSES, PRIORITIES } from "@/constants/options";
import { formatNumber, formatRelative } from "@/utils/format";

const fullName = (u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const department = useDepartment(id);
  const members = useDepartmentMembers(id);
  const tickets = useDepartmentTickets(id);
  const { hasBranches } = useBranchOptions({ includeNone: false });

  if (department.error) return <ErrorState error={department.error} onRetry={department.refetch} />;

  if (department.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!department.data) {
    return (
      <EmptyState
        icon={Network}
        title="Department not found"
        description="It may have been deleted."
        actionLabel="Back to departments"
        onAction={() => router.push("/settings/departments")}
      />
    );
  }

  const d = department.data;
  const memberList = members.data ?? [];
  // The API returns a small page plus the real totals, so a long queue reports
  // its true size here and gets worked on the tickets list instead.
  const ticketList = tickets.data?.items ?? [];
  const ticketTotal = tickets.data?.total ?? 0;
  const urgentCount = tickets.data?.urgent ?? 0;
  const hasMore = ticketTotal > ticketList.length;
  // Only worth flagging when there is actually work routed here to miss.
  const noTicketAccess = ticketTotal > 0 ? memberList.filter((u) => !u.canHandleTickets) : [];
  const head = d.head ? `${d.head.firstName ?? ""} ${d.head.lastName ?? ""}`.trim() : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <a href="/settings/departments">
          <ArrowLeft className="h-4 w-4" /> Back to departments
        </a>
      </Button>

      <PageHeader
        title={d.name}
        description={d.description || "Members and open work for this department."}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Members"
          value={formatNumber(memberList.length)}
          icon={Users}
          hint="Active people assigned here"
          loading={members.isPending}
          index={0}
        />
        <StatCard
          title="Open tickets"
          value={formatNumber(ticketTotal)}
          icon={LifeBuoy}
          // Queue size alone doesn't say how bad it is — call out what's hot.
          hint={
            urgentCount
              ? `${formatNumber(urgentCount)} urgent or high priority`
              : "Unresolved and routed here"
          }
          loading={tickets.isPending}
          index={1}
        />
        {/* Who runs it is the daily question; which office it serves is context,
            and "Branch: Company-wide" read like a contradiction next to the
            members table, where each person has a branch of their own. */}
        <StatCard
          title="Head"
          value={head || "Not set"}
          icon={UserCog}
          hint={
            d.branch?.name
              ? `Works out of ${d.branch.name}`
              : "Serves every office — members can be from any branch"
          }
          index={2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription>
              {noTicketAccess.length > 0 ? (
                <span className="text-amber-700 dark:text-amber-500">
                  {noTicketAccess.length === 1
                    ? `${noTicketAccess[0].firstName} can't open this department's tickets — their role doesn't allow it.`
                    : `${noTicketAccess.length} members can't open this department's tickets — their roles don't allow it.`}
                </span>
              ) : (
                "People assigned to this department."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {members.error ? (
              <div className="p-4">
                <ErrorState error={members.error} onRetry={members.refetch} />
              </div>
            ) : members.isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : memberList.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members yet"
                description="Assign this department to a user from User Management."
                className="border-0 py-10"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    {hasBranches && <TableHead>Branch</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar name={fullName(u)} src={u.avatarUrl} className="h-8 w-8" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{fullName(u)}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          {u.id === d.headId && (
                            <Badge variant="secondary" className="shrink-0">
                              Head
                            </Badge>
                          )}
                          {/* Membership and role are independent, so someone can
                              sit in a team whose work their role can't open. */}
                          {!u.canHandleTickets && ticketTotal > 0 && (
                            <Badge
                              variant="outline"
                              className="shrink-0 gap-1 border-amber-500/30 text-amber-700 dark:text-amber-500"
                              title={`${BACKEND_ROLE_LABELS[u.role] || u.role} can't open support tickets`}
                            >
                              <AlertTriangle className="h-3 w-3" /> No ticket access
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {BACKEND_ROLE_LABELS[u.role] || u.role}
                      </TableCell>
                      {hasBranches && (
                        <TableCell className="text-muted-foreground">
                          {u.branch?.name || "—"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Open tickets</CardTitle>
              <CardDescription>
                {hasMore
                  ? `Longest waiting ${ticketList.length} of ${formatNumber(ticketTotal)}.`
                  : "Oldest first — the queue to work through."}
              </CardDescription>
            </div>
            {ticketTotal > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => router.push(`/tickets?departmentId=${d.id}`)}
              >
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {tickets.error ? (
              <div className="p-4">
                <ErrorState error={tickets.error} onRetry={tickets.refetch} />
              </div>
            ) : tickets.isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : ticketList.length === 0 ? (
              <EmptyState
                icon={LifeBuoy}
                title="Nothing in the queue"
                description="Tickets routed to this department will appear here."
                className="border-0 py-10"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Waiting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketList.map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/tickets/${t.id}`)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{t.subject}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.ticketNumber}
                            {t.customer?.name ? ` · ${t.customer.name}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={String(t.status).toLowerCase()}
                          options={TICKET_STATUSES}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={String(t.priority).toLowerCase()}
                          options={PRIORITIES}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelative(t.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
