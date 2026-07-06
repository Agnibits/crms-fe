"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { eventHooks, EVENT_TYPES, TASK_DUE_COLOR } from "@/features/events/hooks";
import { taskHooks } from "@/features/tasks/hooks";
import EventDialog from "@/features/events/EventDialog";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

const EVENT_PREFIX = "ev:";
const TASK_PREFIX = "task:";

const TYPE_HEX = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.hex]));

export default function CalendarPage() {
  const router = useRouter();
  const events = eventHooks.useList({ limit: 200 });
  const tasks = taskHooks.useList({ limit: 200 });
  const patchEvent = eventHooks.usePatch();
  const patchTask = taskHooks.usePatch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [defaults, setDefaults] = useState(null);

  const eventItems = events.data?.items ?? [];
  const taskItems = tasks.data?.items ?? [];

  const calendarEvents = useMemo(() => {
    const fromEvents = eventItems.map((event) => {
      const hex = TYPE_HEX[event.type] || TYPE_HEX.meeting;
      return {
        id: `${EVENT_PREFIX}${event.id}`,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: !!event.allDay,
        backgroundColor: hex,
        borderColor: hex,
        textColor: "#ffffff",
      };
    });
    const fromTasks = taskItems
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `${TASK_PREFIX}${task.id}`,
        title: `Task: ${task.title}`,
        start: task.dueDate,
        allDay: true,
        backgroundColor: TASK_DUE_COLOR,
        borderColor: TASK_DUE_COLOR,
        textColor: "#ffffff",
      }));
    return [...fromEvents, ...fromTasks];
  }, [eventItems, taskItems]);

  function openCreate(prefill = null) {
    setEditingEvent(null);
    setDefaults(prefill);
    setDialogOpen(true);
  }

  function handleDateClick(info) {
    // Month-view clicks give a date-only string — default to 10:00 that day.
    const start = info.allDay
      ? new Date(`${info.dateStr}T10:00:00`)
      : new Date(info.date);
    openCreate({ start: start.toISOString() });
  }

  function handleEventClick(info) {
    const id = info.event.id;
    if (id.startsWith(EVENT_PREFIX)) {
      const event = eventItems.find((item) => item.id === id.slice(EVENT_PREFIX.length));
      if (event) {
        setEditingEvent(event);
        setDefaults(null);
        setDialogOpen(true);
      }
    } else if (id.startsWith(TASK_PREFIX)) {
      router.push(`/tasks/${id.slice(TASK_PREFIX.length)}`);
    }
  }

  function handleEventChange(info) {
    const id = info.event.id;
    if (id.startsWith(EVENT_PREFIX)) {
      patchEvent.mutate(
        {
          id: id.slice(EVENT_PREFIX.length),
          start: info.event.start?.toISOString(),
          end: (info.event.end ?? info.event.start)?.toISOString(),
        },
        { onError: () => info.revert() }
      );
    } else if (id.startsWith(TASK_PREFIX)) {
      patchTask.mutate(
        { id: id.slice(TASK_PREFIX.length), dueDate: info.event.start?.toISOString() },
        { onError: () => info.revert() }
      );
    }
  }

  const loading = events.isPending || tasks.isPending;
  const error = events.error || tasks.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Meetings, follow-ups, reminders and task deadlines in one place."
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <LoadingSpinner label="Loading calendar…" fullPage />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => {
                events.refetch();
                tasks.refetch();
              }}
            />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              events={calendarEvents}
              editable
              selectable
              dayMaxEventRows={4}
              nowIndicator
              height="auto"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventChange}
              eventResize={handleEventChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {EVENT_TYPES.map((type) => (
          <span key={type.value} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: type.hex }}
              aria-hidden="true"
            />
            {type.label}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: TASK_DUE_COLOR }}
            aria-hidden="true"
          />
          Task due
        </span>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        defaults={defaults}
      />
    </div>
  );
}
