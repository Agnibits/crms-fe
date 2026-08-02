"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, LifeBuoy, Network, Users } from "lucide-react";
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
  const ticketList = tickets.data ?? [];
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
          value={formatNumber(ticketList.length)}
          icon={LifeBuoy}
          hint="Unresolved and routed here"
          loading={tickets.isPending}
          index={1}
        />
        <StatCard
          title="Branch"
          value={d.branch?.name || "Company-wide"}
          icon={Building2}
          hint={head ? `Head: ${head}` : "No head assigned"}
          index={2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription>People assigned to this department.</CardDescription>
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
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {BACKEND_ROLE_LABELS[u.role] || u.role}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Open tickets</CardTitle>
            <CardDescription>Oldest first — the queue to work through.</CardDescription>
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
