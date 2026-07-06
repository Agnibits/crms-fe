"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Eye,
  Mail,
  MessageSquare,
  MousePointerClick,
  Pause,
  Play,
  Send,
  Trash2,
  Users,
  CalendarClock,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorState from "@/components/common/ErrorState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { campaignHooks } from "@/features/campaigns/hooks";
import { CAMPAIGN_STATUSES } from "@/constants/options";
import { formatDateTime, formatNumber, formatPercent, formatRelative } from "@/utils/format";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: campaign, isPending, error, refetch } = campaignHooks.useDetail(id);
  const patch = campaignHooks.usePatch();
  const create = campaignHooks.useCreate({
    onSuccess: (data) => router.push(`/marketing/${data?.id ?? ""}`),
  });
  const remove = campaignHooks.useRemove({ onSuccess: () => router.push("/marketing") });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rates = useMemo(() => {
    const sent = campaign?.sent || 0;
    const opened = campaign?.opened || 0;
    const clicked = campaign?.clicked || 0;
    return {
      sent,
      opened,
      clicked,
      openRate: sent ? (opened / sent) * 100 : 0,
      clickRate: sent ? (clicked / sent) * 100 : 0,
      clickToOpen: opened ? (clicked / opened) * 100 : 0,
    };
  }, [campaign]);

  if (isPending) return <LoadingSpinner fullPage label="Loading campaign…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!campaign) return <ErrorState title="Campaign not found" onRetry={refetch} />;

  const isEmail = campaign.type === "email";
  const TypeIcon = isEmail ? Mail : MessageSquare;
  const canPause = ["running", "scheduled"].includes(campaign.status);
  const canResume = campaign.status === "paused";

  const duplicate = () => {
    create.mutate({
      name: `${campaign.name} (copy)`,
      type: campaign.type,
      audience: campaign.audience,
      subject: campaign.subject ?? "",
      body: campaign.body ?? "",
      message: campaign.message ?? "",
      scheduledAt: null,
      status: "draft",
      sent: 0,
      opened: 0,
      clicked: 0,
    });
  };

  const smsText = campaign.message || campaign.body || campaign.subject || "—";

  const funnel = [
    { label: "Sent", value: rates.sent, pct: rates.sent ? 100 : 0, icon: Send },
    { label: "Opened", value: rates.opened, pct: rates.openRate, icon: Eye },
    { label: "Clicked", value: rates.clicked, pct: rates.clickRate, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {campaign.name}
            <StatusBadge value={campaign.status} options={CAMPAIGN_STATUSES} />
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3.5 w-3.5" /> {isEmail ? "Email campaign" : "SMS campaign"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {campaign.audience || "—"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : "Not scheduled"}
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/marketing")}>
              <ArrowLeft /> Back
            </Button>
            {(canPause || canResume) && (
              <Button
                variant="outline"
                disabled={patch.isPending}
                onClick={() =>
                  patch.mutate({ id: campaign.id, status: canPause ? "paused" : "running" })
                }
              >
                {canPause ? (
                  <>
                    <Pause /> Pause
                  </>
                ) : (
                  <>
                    <Play /> Resume
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" disabled={create.isPending} onClick={duplicate}>
              <Copy /> Duplicate
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Sent</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Send className="h-4.5 w-4.5 text-primary" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatNumber(rates.sent)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {isEmail ? "emails" : "messages"} delivered to {campaign.audience || "audience"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Opened</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-4.5 w-4.5 text-primary" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatNumber(rates.opened)}
            </p>
            <Progress value={rates.openRate} className="mt-3" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatPercent(rates.openRate)} open rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Clicked</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <MousePointerClick className="h-4.5 w-4.5 text-primary" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatNumber(rates.clicked)}
            </p>
            <Progress value={rates.clickRate} className="mt-3" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatPercent(rates.clickRate)} click rate · {formatPercent(rates.clickToOpen)} of opens
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Funnel breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Engagement Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {funnel.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {step.label}
                    </p>
                    <p className="text-sm tabular-nums">
                      <span className="font-semibold">{formatNumber(step.value)}</span>{" "}
                      <span className="text-muted-foreground">({formatPercent(step.pct)})</span>
                    </p>
                  </div>
                  <Progress value={step.pct} className="mt-2" />
                </div>
              );
            })}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Created {formatRelative(campaign.createdAt)} · percentages relative to total sent.
            </p>
          </CardContent>
        </Card>

        {/* Content preview */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {isEmail ? (
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">AgniBits CRM</p>
                      <p className="text-xs text-muted-foreground">
                        to: {campaign.audience || "your audience"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{campaign.subject || "—"}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {campaign.body || "No body content saved for this campaign."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center rounded-xl border bg-muted/30 p-4">
                <div className="w-full max-w-[280px] rounded-[1.5rem] border bg-card p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 border-b pb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">AGNIBT</p>
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {smsText}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {campaign.scheduledAt ? formatRelative(campaign.scheduledAt) : "draft"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete campaign?"
        description={`"${campaign.name}" and its stats will be permanently removed.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(campaign.id)}
      />
    </div>
  );
}
