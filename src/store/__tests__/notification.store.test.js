import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "../notification.store";

const seed = [
  { id: "1", title: "A", read: false },
  { id: "2", title: "B", read: true },
  { id: "3", title: "C", read: false },
];

describe("notification store", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0, panelOpen: false });
  });

  it("setNotifications computes unread count", () => {
    useNotificationStore.getState().setNotifications(seed);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("addNotification prepends and increments unread", () => {
    useNotificationStore.getState().setNotifications(seed);
    useNotificationStore.getState().addNotification({ id: "4", title: "D" });
    const state = useNotificationStore.getState();
    expect(state.notifications[0].id).toBe("4");
    expect(state.unreadCount).toBe(3);
  });

  it("markAsRead updates a single notification", () => {
    useNotificationStore.getState().setNotifications(seed);
    useNotificationStore.getState().markAsRead("1");
    const state = useNotificationStore.getState();
    expect(state.notifications.find((n) => n.id === "1").read).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("markAllAsRead zeroes the counter", () => {
    useNotificationStore.getState().setNotifications(seed);
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("removeNotification recomputes unread", () => {
    useNotificationStore.getState().setNotifications(seed);
    useNotificationStore.getState().removeNotification("1");
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });
});
