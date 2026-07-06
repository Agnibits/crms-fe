"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  MessageSquare,
  Pencil,
  PhoneCall,
  StickyNote,
  Trash2,
  Video,
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
import { opportunityHooks } from "@/features/opportunities/hooks";
import { useUsersOptions } from "@/features/leads/useUsersOptions";
import { DEAL_STAGES } from "@/constants/options";
import { formatCurrency, formatDate, formatRelative } from "@/utils/format";

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
        description="Calls, meetings, emails and notes related to this opportunity will appear here."
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

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: opportunity, isPending, error, refetch } = opportunityHooks.useDetail(id);
  const timeline = opportunityHooks.useSub(id, "timeline");
  const remove = opportunityHooks.useRemove();
  const { usersById } = useUsersOptions();
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
  if (!opportunity) return <EmptyState title="Opportunity not found" />;

  const owner = usersById[opportunity.ownerId];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to opportunities"
              onClick={() => router.push("/opportunities")}
            >
              <ArrowLeft />
            </Button>
            {opportunity.name}
          </span>
        }
        description={opportunity.customerName}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
            >
              <Pencil /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">{opportunity.name}</p>
              <StatusBadge value={opportunity.stage} options={DEAL_STAGES} />
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {opportunity.customerName}
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 lg:max-w-2xl">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(opportunity.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Probability</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={opportunity.probability} className="h-2 flex-1" />
                <span className="text-sm font-medium tabular-nums">
                  {opportunity.probability}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Close</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDate(opportunity.expectedCloseDate)}
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opportunity Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{opportunity.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <StatusBadge value={opportunity.stage} options={DEAL_STAGES} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(opportunity.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Weighted Value</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(
                      ((opportunity.amount || 0) * (opportunity.probability || 0)) / 100
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expected Close</span>
                  <span className="font-medium">
                    {formatDate(opportunity.expectedCloseDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">{owner?.name ?? "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(opportunity.createdAt)}</span>
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Delete opportunity?"
        description="This will permanently remove the opportunity. This action cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(opportunity.id, { onSuccess: () => router.push("/opportunities") })
        }
      />
    </div>
  );
}
