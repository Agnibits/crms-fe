"use client";

import { Bell, CheckCheck, Handshake, LifeBuoy, ListChecks, Receipt, Target, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/common/EmptyState";
import { useNotificationStore } from "@/store/notification.store";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";

const TYPE_ICONS = {
  lead: Target,
  deal: Handshake,
  invoice: Receipt,
  task: ListChecks,
  ticket: LifeBuoy,
  system: Info,
};

export default function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, setPanelOpen, markAsRead: markLocal, markAllAsRead: markAllLocal } =
    useNotificationStore();
  const { markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAll = () => {
    markAllLocal();
    markAllAsRead.mutate();
  };

  const handleRead = (notification) => {
    if (notification.read) return;
    markLocal(notification.id);
    markAsRead.mutate(notification.id);
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
              <SheetTitle>Notifications</SheetTitle>
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
                description="New notifications about leads, deals and tasks will appear here."
                className="m-4"
              />
            ) : (
              <ul className="divide-y">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] || Info;
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleRead(notification)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 cursor-pointer",
                          !notification.read && "bg-primary/5"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={cn("truncate text-sm", !notification.read && "font-semibold")}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {notification.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-foreground/70">
                            {formatRelative(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
