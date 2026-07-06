"use client";

import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  /** Prepend a realtime notification (from socket.io). */
  addNotification: (notification) =>
    set((state) => ({
      notifications: [{ read: false, ...notification }, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),

  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),
}));
