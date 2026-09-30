import { useState } from "react";
import { EventForm } from "./components/EventForm";
import { EventCalendar } from "./components/EventCalendar";
import { mockTemplates } from "./mocks/templates";
import { mockEvents } from "./mocks/events";
import type { CreateEventInput, EventSummary } from "./types";

export default function App() {
  const [view, setView] = useState<"calendar" | "create">("calendar");
  const [events, setEvents] = useState<EventSummary[]>(mockEvents);

  // Temporary: stands in for the createEvent mutation.
  function handleCreate(input: CreateEventInput) {
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: input.name,
        gameId: input.gameId,
        format: input.format,
        startsAt: `${input.startDate}T${input.startTime}`,
        durationMinutes: input.durationMinutes,
        capacity: input.capacity,
        registeredCount: 0,
      },
    ]);
    setView("calendar");
  }

  return (
    <main style={{ padding: 24 }}>
      <nav style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setView("calendar")}>Calendar</button>
        <button onClick={() => setView("create")}>Create event</button>
      </nav>
      {view === "calendar" ? (
        <EventCalendar events={events} templates={mockTemplates} />
      ) : (
        <EventForm templates={mockTemplates} onSubmit={handleCreate} />
      )}
    </main>
  );
}
