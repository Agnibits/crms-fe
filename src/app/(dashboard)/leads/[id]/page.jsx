"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Merge,
  MoreHorizontal,
  Pencil,
  Phone,
  PhoneCall,
  StickyNote,
  Trash2,
  UserCheck,
  UserPlus,
  Video,
  MessageSquare,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConvertLeadDialog from "@/features/leads/ConvertLeadDialog";
import MergeLeadsDialog from "@/features/leads/MergeLeadsDialog";
import { leadHooks } from "@/features/leads/hooks";
import { useUsersOptions } from "@/features/leads/useUsersOptions";
import { LEAD_STAGES, LEAD_SOURCES, findOption } from "@/constants/options";
import { formatCurrency, formatDate, formatRelative, getInitials } from "@/utils/format";

const ACTIVITY_ICONS = {
  call: PhoneCall,
  meeting: Video,
  email: Mail,
  note: StickyNote,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

function Timeline({ query }) {
  if (query.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />;

  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Calls, meetings, emails and notes related to this lead will appear here."
      />
    );
  }
  return (
    <div className="space-y-1">
      {items.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] || StickyNote;
        return (
          <div key={activity.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{activity.subject}</p>
              {activity.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {activity.description}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activity.userName} · {formatRelative(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: lead, isPending, error, refetch } = leadHooks.useDetail(id);
  const timeline = leadHooks.useSub(id, "timeline");
  const patch = leadHooks.usePatch();
  const remove = leadHooks.useRemove();
  const { options: userOptions, usersById } = useUsersOptions();

  const [convertOpen, setConvertOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!lead) return <EmptyState title="Lead not found" />;

  const owner = usersById[lead.ownerId];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to leads"
              onClick={() => router.push("/leads")}
            >
              <ArrowLeft />
            </Button>
            {lead.name}
          </span>
        }
        description={lead.company}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <UserPlus /> Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
                <DropdownMenuLabel>Assign owner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userOptions.map((u) => (
                  <DropdownMenuItem
                    key={u.value}
                    onClick={() => patch.mutate({ id: lead.id, ownerId: u.value })}
                  >
                    {u.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setConvertOpen(true)}>
              <UserCheck /> Convert to Customer
            </Button>
            <Button variant="outline" onClick={() => router.push(`/leads/${lead.id}/edit`)}>
              <Pencil /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setMergeOpen(true)}>
                  <Merge /> Merge duplicates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {getInitials(lead.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold">{lead.name}</p>
                <StatusBadge value={lead.stage} options={LEAD_STAGES} />
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> {lead.company}
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 lg:max-w-2xl">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Value</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(lead.value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lead Score</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={lead.score} className="h-2 flex-1" />
                <span className="text-sm font-medium tabular-nums">{lead.score}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="mt-1 text-sm font-medium">
                {findOption(LEAD_SOURCES, lead.source)?.label ?? lead.source}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="mt-1 truncate text-sm font-medium">{owner?.name ?? "Unassigned"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">{lead.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{lead.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="text-sm font-medium">{lead.city || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">{lead.company || "—"}</p>
                  </div>
                </div>
                {lead.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{lead.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(lead.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{formatRelative(lead.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <StatusBadge value={lead.stage} options={LEAD_STAGES} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline query={timeline} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConvertLeadDialog lead={lead} open={convertOpen} onOpenChange={setConvertOpen} />
      <MergeLeadsDialog lead={lead} open={mergeOpen} onOpenChange={setMergeOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Delete lead?"
        description="This will permanently remove the lead. This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(lead.id, { onSuccess: () => router.push("/leads") })}
      />
    </div>
  );
}
