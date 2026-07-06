"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Handshake,
  LifeBuoy,
  ListChecks,
  Receipt,
  Target,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationStore } from "@/store/notification.store";
import { formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";

const TYPE_ICONS = {
  lead: Target,
  deal: Handshake,
  invoice: Receipt,
  task: ListChecks,
  ticket: LifeBuoy,
  system: Bell,
};

export default function NotificationsPage() {
  const { isPending, error, refetch, markAsRead, markAllAsRead } = useNotifications();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead);
  const storeMarkAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const [tab, setTab] = useState("all");

  const visible = useMemo(
    () => (tab === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, tab]
  );

  const handleClick = (notification) => {
    if (notification.read) return;
    storeMarkAsRead(notification.id); // instant feedback
    markAsRead.mutate(notification.id);
  };

  const handleMarkAll = () => {
    storeMarkAllAsRead();
    markAllAsRead.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, in one place."
        actions={
          <Button
            variant="outline"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || markAllAsRead.isPending}
          >
            <CheckCheck /> Mark all as read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isPending && notifications.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={tab === "unread" ? "You're all caught up" : "No notifications yet"}
          description={
            tab === "unread"
              ? "No unread notifications — nice work."
              : "Updates about leads, deals, invoices and tickets will show up here."
          }
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {visible.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Bell;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/[0.03]"
                  )}
                  aria-label={
                    notification.read
                      ? notification.title
                      : `${notification.title} (unread — click to mark as read)`
                  }
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      notification.read
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          notification.read ? "font-normal" : "font-semibold"
                        )}
                      >
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                    </span>
                    {notification.message && (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {notification.message}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
