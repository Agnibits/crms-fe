"use client";

import { createCrudHooks } from "@/hooks/useCrud";
import { eventService } from "@/services/event.service";
import { QUERY_KEYS } from "@/constants/app";

export const eventHooks = createCrudHooks({
  key: QUERY_KEYS.events,
  service: eventService,
  label: "Event",
});

/** Option list + colors for calendar event types (local to this feature). */
export const EVENT_TYPES = [
  { value: "meeting", label: "Meeting", color: "violet", hex: "#8b5cf6" },
  { value: "event", label: "Event", color: "cyan", hex: "#06b6d4" },
  { value: "follow_up", label: "Follow-up", color: "amber", hex: "#f59e0b" },
  { value: "task", label: "Task", color: "green", hex: "#22c55e" },
  { value: "reminder", label: "Reminder", color: "red", hex: "#ef4444" },
];

/** Color used for tasks-with-dueDate rendered on the calendar. */
export const TASK_DUE_COLOR = "#3b82f6";
