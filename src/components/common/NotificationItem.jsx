"use client";

import { Bell, Handshake, Info, LifeBuoy, ListChecks, Mail, Receipt, Target } from "lucide-react";
import { formatRelative, getInitials } from "@/utils/format";
import { cn } from "@/utils/cn";

const TYPE_ICONS = {
  email: Mail,
  lead: Target,
  deal: Handshake,
  invoice: Receipt,
  task: ListChecks,
  ticket: LifeBuoy,
  system: Bell,
};

// Deterministic per-sender tint so different people are distinguishable at a
// glance (theme-aware; colour + initials do the work — no emoji).
const AVATAR_TINTS = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
  "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
];

function tintFor(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i)) % AVATAR_TINTS.length;
  return AVATAR_TINTS[h];
}

/**
 * One notification row — shared by the bell panel and the notifications page so
 * the two never drift. Email notifications render like an inbox preview (sender
 * avatar, subject, body snippet); other kinds fall back to a typed icon.
 */
export default function NotificationItem({ notification, onSelect, className }) {
  const unread = !notification.read;
  const data = notification.data || {};
  const isEmail = data.kind === "email";
  const preview = data.preview;
  const Icon = TYPE_ICONS[data.kind] || Info;
  const initials = isEmail ? getInitials(notification.title) : "";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(notification)}
      aria-label={unread ? `${notification.title} — unread` : notification.title}
      className={cn(
        "relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
        unread && "bg-primary/[0.04]",
        className
      )}
    >
      {unread && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />}

      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isEmail && initials ? tintFor(notification.title) : "bg-muted text-muted-foreground"
        )}
      >
        {isEmail && initials ? initials : <Icon className="h-4 w-4" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              unread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
            )}
          >
            {notification.title}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatRelative(notification.createdAt)}
          </span>
        </span>

        {notification.message && (
          <span className="mt-0.5 block truncate text-[13px] text-foreground/70">
            {notification.message}
          </span>
        )}

        {preview && (
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{preview}</span>
        )}
      </span>

      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
    </button>
  );
}
