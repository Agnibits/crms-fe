"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  PhoneCall,
  Plus,
  StickyNote,
  Video,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_TYPES } from "@/constants/options";
import { formatDate, formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";
import { activityHooks } from "@/features/activities/hooks";
import LogActivityDialog from "@/features/activities/LogActivityDialog";

const PAGE_STEP = 20;

const TYPE_ICONS = {
  call: PhoneCall,
  meeting: Video,
  email: Mail,
  note: StickyNote,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

const TYPE_BUBBLES = {
  call: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  meeting: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  email: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  note: "bg-muted text-muted-foreground",
  whatsapp: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sms: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(value);
}

export default function ActivitiesPage() {
  const [type, setType] = useState("all");
  const [limit, setLimit] = useState(PAGE_STEP);
  const [logOpen, setLogOpen] = useState(false);

  const params = useMemo(
    () => ({
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(type !== "all" ? { type } : {}),
    }),
    [limit, type]
  );

  const { data, isPending, isFetching, error, refetch } = activityHooks.useList(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const groups = useMemo(() => {
    const map = new Map();
    for (const activity of items) {
      const label = dayLabel(activity.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(activity);
    }
    return [...map.entries()];
  }, [items]);

  function selectType(value) {
    setType(value);
    setLimit(PAGE_STEP);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Every call, meeting, email and note across your pipeline."
        actions={
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4" /> Log Activity
          </Button>
        }
      />

      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={type === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => selectType("all")}
        >
          All
        </Button>
        {ACTIVITY_TYPES.map((option) => {
          const Icon = TYPE_ICONS[option.value] || StickyNote;
          return (
            <Button
              key={option.value}
              variant={type === option.value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => selectType(option.value)}
            >
              <Icon className="h-3.5 w-3.5" /> {option.label}
            </Button>
          );
        })}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isPending ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Log your first call, meeting or note to start building the timeline."
          actionLabel="Log Activity"
          onAction={() => setLogOpen(true)}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-8">
              {groups.map(([label, activities]) => (
                <div key={label}>
                  <div className="mb-4 flex items-center gap-3">
                    <h3 className="text-sm font-semibold">{label}</h3>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="relative ml-5 space-y-6 border-l pl-6">
                    {activities.map((activity) => {
                      const Icon = TYPE_ICONS[activity.type] || StickyNote;
                      return (
                        <div key={activity.id} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[43px] flex h-9 w-9 items-center justify-center rounded-full border bg-card",
                              TYPE_BUBBLES[activity.type] || TYPE_BUBBLES.note
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <p className="text-sm font-medium">{activity.subject}</p>
                              <p className="shrink-0 text-xs text-muted-foreground">
                                {formatRelative(activity.createdAt)}
                              </p>
                            </div>
                            {activity.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {activity.userName && <span>{activity.userName}</span>}
                              {activity.duration ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {activity.duration} min
                                </span>
                              ) : null}
                              {activity.relatedTo?.name && (
                                <span>· {activity.relatedTo.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {items.length < total && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  disabled={isFetching}
                  onClick={() => setLimit((prev) => prev + PAGE_STEP)}
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Load more ({items.length} of {total})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
