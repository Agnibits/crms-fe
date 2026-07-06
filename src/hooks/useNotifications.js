"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notificationService } from "@/services/notification.service";
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

  const query = useQuery({
    queryKey: [...QUERY_KEYS.notifications],
    queryFn: ({ signal }) => notificationService.list({ limit: 50 }, { signal }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    const items = query.data?.items ?? query.data ?? [];
    if (Array.isArray(items)) setNotifications(items);
  }, [query.data, setNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;
    return connectSocket((notification) => {
      addNotification(notification);
      toast(notification.title || "New notification", { icon: "🔔" });
    });
  }, [isAuthenticated, addNotification]);

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
