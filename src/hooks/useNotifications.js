"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService, normalizeNotification } from "@/services/notification.service";
import { showNotificationToast } from "@/components/common/NotificationToast";
import { connectSocket } from "@/services/socket";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";
import { QUERY_KEYS } from "@/constants/app";

/**
 * Loads notifications, wires the socket.io realtime channel and exposes
 * read/unread mutations. Mount once inside the dashboard layout.
 */
export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setNotifications, addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.notifications],
    queryFn: ({ signal }) => notificationService.list({ limit: 50 }, { signal }),
    enabled: isAuthenticated,
    staleTime: 20_000,
    // Socket gives instant; this poll guarantees delivery within ~45s even if
    // the socket can't connect (cheap DB read, no IMAP cost).
    refetchInterval: 45_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const items = query.data?.items ?? query.data ?? [];
    if (Array.isArray(items)) setNotifications(items);
  }, [query.data, setNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const openNotification = (n) => {
      const conversationId = n?.data?.conversationId;
      if (conversationId) router.push(`/inbox?c=${conversationId}`);
    };
    return connectSocket({
      // A new notification (e.g. inbound email) — push it into the bell instantly
      // and surface a rich toast (sender + subject + preview) that opens the thread.
      "notification:new": (notification) => {
        const n = normalizeNotification(notification);
        addNotification(n);
        showNotificationToast(n, openNotification);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
      },
      // New inbound message — refresh the inbox list + unread badge instantly.
      "conversation:message": () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      },
    });
  }, [isAuthenticated, addNotification, queryClient, router]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });

  const markAsRead = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: invalidate,
  });

  return { ...query, markAsRead, markAllAsRead };
}
