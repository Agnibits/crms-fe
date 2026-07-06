"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Handshake,
  History,
  Mail,
  MessageSquare,
  Pencil,
  PhoneCall,
  StickyNote,
  Trash2,
  TrendingUp,
  Video,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { dealHooks } from "@/features/deals/hooks";
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

function Timeline({ items, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (!items?.length) {
    return <EmptyState title="No activity yet" description="Activity on this deal will appear here." />;
  }
  return (
    <ol className="relative space-y-4 border-l pl-6">
      {items.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] || StickyNote;
        return (
          <li key={activity.id} className="relative">
            <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-card text-primary">
              <Icon className="h-3 w-3" />
            </span>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{activity.subject}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelative(activity.createdAt)}
                </span>
              </div>
              {activity.description && (
                <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
              )}
              {activity.userName && (
                <p className="mt-1 text-xs text-muted-foreground">by {activity.userName}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export default function DealDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: deal, isPending, error, refetch } = dealHooks.useDetail(id);
  const timeline = dealHooks.useSub(id, "timeline");
  const history = dealHooks.useSub(id, "history");
  const remove = dealHooks.useRemove({ onSuccess: () => router.push("/deals") });
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isPending) return <LoadingSpinner fullPage label="Loading deal…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => router.push("/deals")}>
        <ArrowLeft className="h-4 w-4" /> Back to deals
      </Button>

      <PageHeader
        title={deal.name}
        description={
          <span className="inline-flex items-center gap-2">
            <Link href={`/customers/${deal.customerId}`} className="text-primary hover:underline">
              {deal.customerName}
            </Link>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(`/deals/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Deal Value</p>
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(deal.amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Stage</p>
            <div className="mt-2">
              <StatusBadge value={deal.stage} options={DEAL_STAGES} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Probability</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{deal.probability ?? 0}%</p>
            <Progress value={deal.probability ?? 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Expected Close</p>
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-lg font-semibold">{formatDate(deal.expectedCloseDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Deal Name">{deal.name}</Field>
                <Field label="Customer">
                  <Link href={`/customers/${deal.customerId}`} className="text-primary hover:underline">
                    {deal.customerName}
                  </Link>
                </Field>
                <Field label="Amount">{formatCurrency(deal.amount)}</Field>
                <Field label="Stage">
                  <StatusBadge value={deal.stage} options={DEAL_STAGES} />
                </Field>
                <Field label="Probability">{deal.probability ?? 0}%</Field>
                <Field label="Expected Close Date">{formatDate(deal.expectedCloseDate)}</Field>
                <Field label="Closed At">{deal.closedAt ? formatDate(deal.closedAt) : "—"}</Field>
                <Field label="Created">{formatDate(deal.createdAt)}</Field>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={timeline.data} loading={timeline.isPending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal History</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={history.data} loading={history.isPending} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete this deal?"
        description={`"${deal.name}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(id)}
      />
    </div>
  );
}
