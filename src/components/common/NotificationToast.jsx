"use client";

import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { getInitials } from "@/utils/format";
import { cn } from "@/utils/cn";

/**
 * Rich realtime toast — mirrors the bell row so an incoming email is legible the
 * instant it lands (sender, subject, body snippet), then routes to the thread on
 * click. Fired via `showNotificationToast` so the hook stays JSX-free.
 */
function NotificationToast({ t, notification, onOpen }) {
  const data = notification.data || {};
  const isEmail = data.kind === "email";
  const initials = isEmail ? getInitials(notification.title) : "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onOpen?.(notification);
        toast.dismiss(t.id);
      }}
      className={cn(
        "pointer-events-auto flex w-[360px] max-w-[calc(100vw-2rem)] cursor-pointer items-start gap-3 rounded-xl border bg-background p-3 shadow-lg ring-1 ring-black/5 transition-opacity",
        t.visible ? "opacity-100" : "opacity-0"
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {initials || <Mail className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold">{notification.title}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">now</span>
        </div>
        {notification.message && (
          <div className="truncate text-[13px] text-foreground/70">{notification.message}</div>
        )}
        {data.preview && (
          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{data.preview}</div>
        )}
      </div>
    </div>
  );
}

/** Show the rich toast. id-keyed so a duplicate delivery collapses into one. */
export function showNotificationToast(notification, onOpen) {
  toast.custom((t) => <NotificationToast t={t} notification={notification} onOpen={onOpen} />, {
    id: notification.id ? `notif-${notification.id}` : undefined,
    duration: 6000,
  });
}

export default NotificationToast;
