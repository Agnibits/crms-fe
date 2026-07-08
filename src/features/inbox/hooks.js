"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { conversationService } from "@/services/conversation.service";
import { toastError } from "@/services/api";

const KEY = ["conversations"];

/** Inbox list — polls every 60s so inbound replies show up automatically. */
export function useConversations(params = {}) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: ({ signal }) => conversationService.list(params, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
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
