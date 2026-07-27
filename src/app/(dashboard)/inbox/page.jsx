"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Mail,
  Plus,
  Search,
  Send,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Inbox as InboxIcon,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useConversations,
  useConversation,
  useReply,
  useMarkRead,
  useCloseConversation,
  useReopenConversation,
  useSyncInbox,
} from "@/features/inbox/hooks";
import ComposeDialog from "@/features/inbox/ComposeDialog";
import { useEmailChannels } from "@/features/email/hooks";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

/**
 * Email bodies are HTML; render them as readable plain text. We intentionally
 * do NOT inject HTML (inbound customer email is untrusted → XSS risk), so tags
 * become line breaks and entities are decoded.
 */
function htmlToText(input = "") {
  if (!input) return "";
  return String(input)
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Drop the quoted reply history so a message shows only what was newly written
 * (like Gmail's collapsed "…"). Cuts at the first quote marker or ">" line.
 */
function stripQuoted(text = "") {
  if (!text) return "";
  const lines = text.split("\n");
  const markers = [
    /^\s*On\b.*\bwrote:\s*$/i, // Gmail / Apple Mail
    /^\s*-{2,}\s*Original Message\s*-{2,}/i, // Outlook
    /^\s*From:\s.+\S+@\S+/i, // Outlook header block
    /^\s*_{5,}\s*$/, // separator line
    /^\s*>{1,}/, // quoted line
  ];
  let cut = lines.findIndex((l) => markers.some((re) => re.test(l)));
  const kept = cut === -1 ? lines : lines.slice(0, cut);
  const out = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // If stripping left nothing (edge case), fall back to the full text.
  return out || text.trim();
}

const cleanBody = (body) => stripQuoted(htmlToText(body));

function ConversationRow({ conversation, active, onClick }) {
  const unread = conversation.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        active && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
          {conversation.externalId || "Unknown sender"}
        </span>
        <span
          className={cn(
            "shrink-0 text-[11px]",
            unread ? "font-medium text-primary" : "text-muted-foreground"
          )}
        >
          {conversation.lastMessageAt ? formatRelative(conversation.lastMessageAt) : ""}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className={cn("truncate text-sm", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
          {conversation.subject || "(no subject)"}
        </p>
        {unread && (
          <span
            className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
            aria-label={`${conversation.unreadCount} unread`}
          >
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="mt-1">
        {conversation.status === "CLOSED" ? (
          <Badge variant="secondary" className="text-[10px]">Closed</Badge>
        ) : (
          <Badge className="bg-primary/10 text-[10px] text-primary">Open</Badge>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const outbound = message.direction === "OUTBOUND";
  const failed = message.status === "FAILED";
  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          outbound ? "bg-primary text-primary-foreground" : "border bg-muted/40"
        )}
      >
        <p className="mb-1 text-[11px] opacity-70">
          {message.fromAddress} · {formatRelative(message.createdAt)}
        </p>
        <p className="whitespace-pre-wrap break-words">{cleanBody(message.body)}</p>
        {failed && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-destructive-foreground/90">
            <AlertTriangle className="h-3 w-3" /> Failed to send
          </p>
        )}
      </div>
    </div>
  );
}

function Thread({ id }) {
  const { data: conversation, isPending, error, refetch } = useConversation(id);
  const reply = useReply(id);
  const close = useCloseConversation();
  const reopen = useReopenConversation();
  const [text, setText] = useState("");

  useEffect(() => setText(""), [id]);

  if (!id) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState icon={Mail} title="Select a conversation" description="Pick a thread on the left to read and reply." className="border-0" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isPending) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-2/3" />)}
      </div>
    );
  }

  const isClosed = conversation.status === "CLOSED";
  const messages = conversation.messages ?? [];

  const sendReply = () => {
    const body = text.trim();
    if (!body) return;
    reply.mutate({ body }, { onSuccess: () => setText("") });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{conversation.subject || "(no subject)"}</p>
          <p className="truncate text-xs text-muted-foreground">{conversation.externalId}</p>
        </div>
        {isClosed ? (
          <Button variant="outline" size="sm" onClick={() => reopen.mutate(id)} loading={reopen.isPending}>
            <RotateCcw className="h-4 w-4" /> Reopen
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => close.mutate(id)} loading={close.isPending}>
            <CheckCircle2 className="h-4 w-4" /> Close
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState title="No messages" className="border-0" />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isClosed ? "Reopen to reply…" : "Type your reply…"}
          rows={3}
          disabled={isClosed}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter to send</span>
          <Button size="sm" onClick={sendReply} loading={reply.isPending} disabled={isClosed || !text.trim()}>
            <Send className="h-4 w-4" /> Reply
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);
  const [compose, setCompose] = useState(false);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  // The inbox sends/receives through the company's own email channel. Without
  // one connected, composing would just 400 — so guide the user to set it up.
  const { data: channels, isPending: channelsPending } = useEmailChannels();
  const needsSetup = !channelsPending && (channels?.length ?? 0) === 0;

  const params = {
    ...(status !== "all" ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    limit: 50,
  };
  const { data, isPending, error, refetch } = useConversations(params);
  const markRead = useMarkRead();
  const manualSync = useSyncInbox();
  const autoSync = useSyncInbox({ silent: true });

  // Pull new inbound mail while the inbox is open (belt-and-suspenders over the
  // server-side poller): once on mount, then every 60s.
  useEffect(() => {
    autoSync.mutate();
    const t = setInterval(() => autoSync.mutate(), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conversations = data?.items ?? [];

  // WhatsApp-style: when the total unread count rises (a new inbound arrived
  // via a sync), toast the sender and reflect the count in the browser tab.
  const prevUnreadRef = useRef(null);
  useEffect(() => {
    const total = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    if (prevUnreadRef.current !== null && total > prevUnreadRef.current) {
      const newest = [...conversations]
        .filter((c) => c.unreadCount > 0)
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))[0];
      toast.success(newest ? `New message from ${newest.externalId}` : "New message received");
    }
    prevUnreadRef.current = total;
    document.title = total > 0 ? `(${total}) Inbox · AgniBits CRM` : "Inbox · AgniBits CRM";
  }, [conversations]);

  useEffect(() => () => { document.title = "AgniBits CRM"; }, []);

  const select = (c) => {
    setSelectedId(c.id);
    if (c.unreadCount > 0) markRead.mutate(c.id);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inbox"
        description="Two-way email with your customers and leads."
        actions={
          needsSetup ? (
            <Button onClick={() => router.push("/settings/email")}>
              <Mail className="h-4 w-4" /> Connect email
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => manualSync.mutate()}
                disabled={manualSync.isPending}
              >
                <RefreshCw className={cn("h-4 w-4", manualSync.isPending && "animate-spin")} />
                Sync
              </Button>
              <Button onClick={() => setCompose(true)}>
                <Plus className="h-4 w-4" /> New email
              </Button>
            </div>
          )
        }
      />

      {needsSetup && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Connect your email to get started</p>
              <p className="text-sm text-muted-foreground">
                The inbox sends and receives through your company email account. Connect one to
                start emailing customers and leads.
              </p>
            </div>
          </div>
          <Button className="shrink-0" onClick={() => router.push("/settings/email")}>
            <Mail className="h-4 w-4" /> Connect email
          </Button>
        </div>
      )}

      <div className="grid h-[calc(100vh-230px)] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* List pane */}
        <div className="flex flex-col overflow-hidden rounded-xl border">
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-28" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-4"><ErrorState error={error} onRetry={refetch} /></div>
            ) : isPending ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState icon={InboxIcon} title="No conversations" description="Send an email to start one." className="border-0" />
            ) : (
              conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  active={c.id === selectedId}
                  onClick={() => select(c)}
                />
              ))
            )}
          </div>
        </div>

        {/* Thread pane */}
        <div className="overflow-hidden rounded-xl border">
          <Thread id={selectedId} />
        </div>
      </div>

      <ComposeDialog open={compose} onOpenChange={setCompose} />
    </div>
  );
}
