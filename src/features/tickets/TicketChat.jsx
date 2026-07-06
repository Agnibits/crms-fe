"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/common/UserAvatar";
import EmptyState from "@/components/common/EmptyState";
import { ticketService } from "@/services/ticket.service";
import { toastError } from "@/services/api";
import { formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";

/**
 * Conversation thread for a support ticket. Customer messages render on the
 * left with an avatar; agent replies on the right in primary bubbles.
 * Replies are appended optimistically to local state (merged with the
 * server-provided messages) before the API call resolves.
 */
export default function TicketChat({ ticket, className }) {
  const [localMessages, setLocalMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const messages = useMemo(() => {
    const server = ticket?.messages ?? [];
    // Avoid duplicating optimistic messages if the server ever echoes them back.
    const serverIds = new Set(server.map((m) => m.id));
    return [...server, ...localMessages.filter((m) => !serverIds.has(m.id))];
  }, [ticket?.messages, localMessages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !ticket?.id) return;

    const optimistic = {
      id: `local-${Date.now()}`,
      from: "agent",
      author: "You",
      body,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    try {
      await ticketService.action(ticket.id, "messages", { body });
      toast.success("Reply sent");
    } catch (error) {
      // Roll back the optimistic message on failure.
      setLocalMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
      toastError(error, "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Start the conversation by sending a reply below."
              className="border-0 py-10"
            />
          ) : (
            messages.map((message) => {
              const isAgent = message.from === "agent";
              return (
                <div
                  key={message.id}
                  className={cn("flex items-end gap-2", isAgent ? "justify-end" : "justify-start")}
                >
                  {!isAgent && (
                    <UserAvatar name={message.author} className="h-8 w-8 shrink-0 text-xs" />
                  )}
                  <div className={cn("max-w-[80%] sm:max-w-[70%]", isAgent && "text-right")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-left text-sm whitespace-pre-wrap",
                        isAgent
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted"
                      )}
                    >
                      {message.body}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {message.author} · {formatRelative(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="space-y-2 border-t pt-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Type your reply…"
            aria-label="Reply message"
            disabled={sending}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Press Ctrl+Enter to send
            </p>
            <Button onClick={send} disabled={sending || !draft.trim()}>
              <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
