import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventSummary, GameTemplate } from "../types";
import { timeRange, toDateStr } from "../lib/dates";

interface Props {
  events: EventSummary[];
  templates: GameTemplate[];
  onOpenEvent: (id: string) => void; 
}

export function EventCalendar({ events, templates, onOpenEvent }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));

  const gameName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? id;

  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.name,
        start: e.startsAt, // floating local time, no offset on purpose
        duration: { minutes: e.durationMinutes },
      })),
    [events],
  );

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.startsAt.startsWith(selectedDate))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events, selectedDate],
  );

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        selectable
        unselectAuto={false} // keep the day highlighted when clicking the agenda
        select={(info) => setSelectedDate(info.startStr)}
        eventClick={(info) => {
          const clicked = events.find((e) => e.id === info.event.id);
          if (clicked) setSelectedDate(clicked.startsAt.slice(0, 10));
        }}
        height="auto"
        displayEventEnd
      />

      <section>
        <h3>Events on {selectedDate}</h3>
        {dayEvents.length === 0 && <p>No events scheduled.</p>}
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {dayEvents.map((e) => {
            const full = e.registeredCount >= e.capacity;
            return (
              <li
                key={e.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                <strong>{e.name}</strong>
                <div>
                  {timeRange(e.startsAt, e.durationMinutes)} ·{" "}
                  {gameName(e.gameId)} · {e.format}
                </div>
                <div>
                  {full
                    ? "Full"
                    : `${e.capacity - e.registeredCount} spots left`}{" "}
                  ({e.registeredCount}/{e.capacity})
                </div>
                <button onClick={() => onOpenEvent(e.id)}>Details</button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
