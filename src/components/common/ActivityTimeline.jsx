"use client";

import { useState } from "react";
import { Mail, MessageSquare, PhoneCall, StickyNote, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { formatRelative } from "@/utils/format";

const ACTIVITY_ICONS = {
  call: PhoneCall,
  meeting: Video,
  email: Mail,
  note: StickyNote,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

/**
 * Timeline entry body: keeps the author's line breaks, collapses long
 * entries behind a Show more toggle so the timeline stays scannable.
 */
function TimelineBody({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 220 || text.split("\n").length > 3;
  return (
    <div className="mt-1">
      <p
        className={`whitespace-pre-wrap text-sm text-muted-foreground ${
          !expanded && isLong ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/**
 * Merged activity + note timeline. Accepts a react-query result whose data is
 * the backend timeline shape: [{ kind: 'activity'|'note', at, data }].
 *   <ActivityTimeline query={timelineQuery} emptyDescription="…" />
 */
export default function ActivityTimeline({ query, emptyDescription }) {
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
        description={
          emptyDescription ??
          "Calls, meetings, emails and notes related to this record will appear here."
        }
      />
    );
  }
  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const rec = item.data ?? item;
        const isNote = item.kind === "note";
        const type = String(rec.type ?? "").toLowerCase();
        const Icon = isNote ? StickyNote : ACTIVITY_ICONS[type] || StickyNote;
        const title = isNote ? rec.title || "Note" : rec.subject;
        const body = isNote ? rec.content : rec.description;
        const who =
          rec.userName || [rec.user?.firstName, rec.user?.lastName].filter(Boolean).join(" ");
        const when = item.at || rec.createdAt;
        return (
          <div
            key={rec.id ?? i}
            className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <TimelineBody text={body} />
              <p className="mt-1 text-xs text-muted-foreground/80">
                {who ? `${who} · ` : ""}
                {formatRelative(when)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
