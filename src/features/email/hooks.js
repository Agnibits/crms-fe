"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { emailChannelService } from "@/services/emailChannel.service";
import { toastError } from "@/services/api";

const KEY = ["email-channels"];

export function useEmailChannels() {
  return useQuery({
    queryKey: KEY,
    queryFn: ({ signal }) => emailChannelService.list({ signal }),
  });
}

export function useConnectChannel(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => emailChannelService.create(payload),
    onSuccess: (d, v, c) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Email account connected");
      options.onSuccess?.(d, v, c);
    },
    onError: (e) => toastError(e, "Failed to connect email account"),
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: (id) => emailChannelService.test(id),
    onSuccess: (d) => toast.success(d?.message || "SMTP connection OK"),
    onError: (e) => toastError(e, "SMTP test failed — check host / credentials"),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => emailChannelService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Email account removed");
    },
    onError: (e) => toastError(e),
  });
}
