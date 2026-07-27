"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/common/EmptyState";
import NotificationItem from "@/components/common/NotificationItem";
import { useNotificationStore } from "@/store/notification.store";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationPanel() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    panelOpen,
    setPanelOpen,
    markAsRead: markLocal,
    markAllAsRead: markAllLocal,
  } = useNotificationStore();
  const { markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAll = () => {
    markAllLocal();
    markAllAsRead.mutate();
  };

  const handleSelect = (notification) => {
    if (!notification.read) {
      markLocal(notification.id); // instant feedback
      markAsRead.mutate(notification.id);
    }
    const conversationId = notification.data?.conversationId;
    if (conversationId) {
      setPanelOpen(false);
      router.push(`/inbox?c=${conversationId}`);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setPanelOpen(true)}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAll}>
                  <CheckCheck className="h-4 w-4" /> Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="You're all caught up"
                description="New notifications about emails, leads, deals and tasks will appear here."
                className="m-4"
              />
            ) : (
              <ul className="divide-y">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} onSelect={handleSelect} />
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
