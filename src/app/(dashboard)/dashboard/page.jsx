"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  Handshake,
  ListChecks,
  Mail,
  MessageSquare,
  PhoneCall,
  StickyNote,
  Target,
  Users,
  Video,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import UserAvatar from "@/components/common/UserAvatar";
import EmptyState from "@/components/common/EmptyState";
import ChartCard from "@/components/charts/ChartCard";
import SalesAreaChart from "@/components/charts/SalesAreaChart";
import FunnelBarChart from "@/components/charts/FunnelBarChart";
import PipelineBarChart from "@/components/charts/PipelineBarChart";
import DonutChart from "@/components/charts/DonutChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TASK_STATUSES, PRIORITIES } from "@/constants/options";
import { useAuthStore } from "@/store/auth.store";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelative,
} from "@/utils/format";
import {
  useDashboardStats,
  useFunnel,
  usePipeline,
  useRecentActivities,
  useSalesChart,
  useUpcomingTasks,
} from "@/features/dashboard/useDashboard";

const ACTIVITY_ICONS = {
  call: PhoneCall,
  meeting: Video,
  email: Mail,
  note: StickyNote,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const stats = useDashboardStats();
  const sales = useSalesChart();
  const funnel = useFunnel();
  const pipeline = usePipeline();
  const activities = useRecentActivities();
  const tasks = useUpcomingTasks();

  const s = stats?.data;

  // A specific, actionable subtitle beats a generic "here's what's happening".
  const firstName = user?.name?.split(" ")[0] || "there";
  const todayStr = new Date().toDateString();
  const isDone = (t) =>
    ["done", "cancelled"].includes(String(t.status || "").toLowerCase());
  const tasksDueToday = (tasks.data || []).filter(
    (t) =>
      t.dueDate &&
      !isDone(t) &&
      new Date(t.dueDate).toDateString() === todayStr,
  ).length;
  // Only promise "vs target" when the API actually returns targets.
  const salesHasTarget = (sales.data || []).some((d) => Number(d.target) > 0);
  const openOpps = s?.openOpportunities ?? 0;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const dashboardSubtitle = stats.isPending
    ? "Getting your day ready…"
    : tasksDueToday > 0
      ? `You have ${plural(tasksDueToday, "task", "tasks")} due today.`
      : openOpps > 0
        ? `You have ${plural(openOpps, "open opportunity", "open opportunities")} in your pipeline.`
        : "You're all caught up — nothing needs your attention right now.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description={dashboardSubtitle}
        actions={
          <Button asChild>
            <Link href="/leads/new">
              <Target className="h-4 w-4" /> New Lead
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={formatNumber(s?.totalCustomers)}
          icon={Users}
          delta={s?.customersGrowth}
          loading={stats.isPending}
          index={0}
        />
        <StatCard
          title="Total Leads"
          value={formatNumber(s?.totalLeads)}
          icon={Target}
          delta={s?.leadsGrowth}
          loading={stats.isPending}
          index={1}
        />
        <StatCard
          title="Total Deals"
          value={formatNumber(s?.totalDeals)}
          icon={Handshake}
          delta={s?.dealsGrowth}
          loading={stats.isPending}
          index={2}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(s?.revenue)}
          icon={DollarSign}
          delta={s?.revenueGrowth}
          loading={stats.isPending}
          index={3}
        />
      </div>

      {/* Sales + conversion */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Monthly Sales"
            description={
              salesHasTarget
                ? "Revenue vs target over the last 12 months"
                : "Revenue over the last 12 months"
            }
            loading={sales.isPending}
            height={320}
          >
            <SalesAreaChart data={sales.data || []} />
          </ChartCard>
        </div>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Conversion &amp; Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats.isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-muted-foreground">
                      Lead Conversion Rate
                    </p>
                    <p className="text-2xl font-semibold">
                      {s?.conversionRate ?? 0}%
                    </p>
                  </div>
                  <Progress value={s?.conversionRate ?? 0} className="mt-2" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Leads that became customers this quarter
                  </p>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-muted-foreground">
                      Win / Loss Ratio
                    </p>
                    <p className="text-2xl font-semibold">{s?.winRate ?? 0}%</p>
                  </div>
                  <Progress
                    value={s?.winRate ?? 0}
                    className="mt-2"
                    indicatorClassName="bg-success"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Closed-won share of all closed deals
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Open Tickets
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatNumber(s?.openTickets)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Pending Tasks
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatNumber(s?.pendingTasks)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel + pipeline */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Sales Funnel"
          description="Lead progression through stages"
          loading={funnel.isPending}
          height={280}
        >
          <FunnelBarChart data={funnel.data || []} />
        </ChartCard>
        <ChartCard
          title="Pipeline Overview"
          description="Open deal value by stage"
          loading={pipeline.isPending}
          height={280}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/deals">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          <PipelineBarChart data={pipeline.data || []} />
        </ChartCard>
      </div>

      {/* Activities + tasks + calendar-ish widget */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent activities */}
        <Card className="flex h-full flex-col xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">Recent Activities</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/activities">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 space-y-1">
            {activities.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : (activities.data || []).length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title="No recent activity"
                description="Calls, emails and meetings with your customers will show up here."
                actionLabel="Log activity"
                onAction={() => router.push("/activities")}
                className="h-full border-0 py-0"
              />
            ) : (
              (activities.data || []).slice(0, 7).map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] || StickyNote;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.userName} ·{" "}
                        {formatRelative(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming tasks */}
        <Card className="flex h-full flex-col xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                Board <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {tasks.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : (tasks.data || []).length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No upcoming tasks"
                description="Follow-ups and to-dos due soon will appear here."
                actionLabel="Create task"
                onAction={() => router.push("/tasks")}
                className="h-full border-0 py-0"
              />
            ) : (
              (tasks.data || []).slice(0, 5).map((task) => (
                <div key={task.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {task.title}
                    </p>
                    <StatusBadge value={task.priority} options={PRIORITIES} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge value={task.status} options={TASK_STATUSES} />
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />{" "}
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deal distribution donut */}
        <div className="xl:col-span-1">
          <ChartCard
            title="Deals by Stage"
            description="Distribution of open and closed deals"
            loading={pipeline.isPending}
            height={280}
          >
            <DonutChart
              data={(pipeline.data || []).map((p) => ({
                name: p.stage,
                value: p.count,
              }))}
              emptyMessage="No deals yet — create your first deal to see the stage breakdown."
              centerLabel={{
                value: formatNumber(
                  (pipeline.data || []).reduce((a, p) => a + p.count, 0),
                ),
                label: "deals",
              }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Calendar CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Your schedule at a glance</p>
                <p className="text-sm text-muted-foreground">
                  Meetings, follow-ups and reminders — all in the calendar view.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/calendar">
                Open calendar <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
