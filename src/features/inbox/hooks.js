"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { conversationService } from "@/services/conversation.service";
import { toastError } from "@/services/api";

const KEY = ["conversations"];

/**
 * App-wide inbound sync: pulls new mail on the server (poll-now) and refreshes
 * conversation queries every 60s from ANY page — so the Inbox nav badge and
 * notifications update even when you're not on the Inbox. Errors (e.g. no
 * permission) are swallowed. Mount once, globally (the dashboard layout).
 */
export function useGlobalInboxSync() {
  const qc = useQueryClient();
  useEffect(() => {
    let alive = true;
    const run = () =>
      conversationService
        .sync()
        .then(() => alive && qc.invalidateQueries({ queryKey: KEY }))
        .catch(() => {});
    run();
    const id = setInterval(run, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [qc]);
}

/** Inbox list — polls every 60s so inbound replies show up automatically. */
export function useConversations(params = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: ({ signal }) => conversationService.list(params, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

/** Total unread conversations — drives the global Inbox nav badge. Polls 60s. */
export function useInboxUnread() {
  return useQuery({
    queryKey: [...KEY, "unread-count"],
    queryFn: async ({ signal }) => {
      const res = await conversationService.list({ status: "open", limit: 100 }, { signal });
      return (res?.items ?? []).filter((c) => (c.unreadCount || 0) > 0).length;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
}

/** A single thread (includes its messages). Polls while open for new replies. */
export function useConversation(id) {
  return useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: ({ signal }) => conversationService.getById(id, { signal }),
    enabled: !!id,
    refetchInterval: id ? 60_000 : false,
  });
}

function useThreadMutation(mutationFn, { success, error, id } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      if (success) toast.success(success);
    },
    onError: (e) => toastError(e, error),
  });
}

/** Manually pull new inbound mail, then refresh the thread list. */
export function useSyncInbox(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => conversationService.sync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      if (!options.silent) toast.success("Inbox synced");
    },
    onError: (e) => {
      if (!options.silent) toastError(e, "Sync failed");
    },
  });
}

export function useSendEmail(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => conversationService.send(payload),
    onSuccess: (d, v, c) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Email sent");
      options.onSuccess?.(d, v, c);
    },
    onError: (e) => toastError(e, "Failed to send email"),
  });
}

export function useReply(id) {
  return useThreadMutation((payload) => conversationService.reply(id, payload), {
    success: "Reply sent",
    error: "Failed to send reply",
  });
}

export const useMarkRead = () =>
  useThreadMutation((id) => conversationService.markRead(id));
export const useAssignConversation = () =>
  useThreadMutation(({ id, assignedUserId }) => conversationService.assign(id, assignedUserId), {
    success: "Conversation assigned",
  });
export const useCloseConversation = () =>
  useThreadMutation((id) => conversationService.close(id), { success: "Conversation closed" });
export const useReopenConversation = () =>
  useThreadMutation((id) => conversationService.reopen(id), { success: "Conversation reopened" });
