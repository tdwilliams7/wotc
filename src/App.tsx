import { useState } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { EventForm } from "./components/EventForm";
import { EventCalendar } from "./components/EventCalendar";
import { EventDetail } from "./components/EventDetail";
import { RegisterPage } from "./components/RegisterPage";
// import { TemplateForm } from "./components/TemplateForm";
import { mockTemplates } from "./mocks/templates";
import { mockEvents } from "./mocks/events";
import type { CreateEventInput, EventSummary, GameTemplate } from "./types";
import {
  normalizeName,
  type RegisterResult,
  validateRegistration,
} from "./lib/registration";

function NotFound() {
  return (
    <p>
      Not found. <Link to="/">Back to calendar</Link>
    </p>
  );
}

function EventDetailRoute({
  events,
  templates,
}: {
  events: EventSummary[];
  templates: GameTemplate[];
}) {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);
  if (!event) return <NotFound />;
  return (
    <EventDetail
      event={event}
      template={templates.find((t) => t.id === event.gameId)}
    />
  );
}

function RegisterRoute({
  events,
  onRegister,
}: {
  events: EventSummary[];
  onRegister: (eventId: string, name: string) => RegisterResult;
}) {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);
  if (!event) return <NotFound />;
  return <RegisterPage event={event} onRegister={onRegister} />;
}

export default function App() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventSummary[]>(mockEvents);
  const [templates, setTemplates] = useState<GameTemplate[]>(mockTemplates);
  // eventId -> normalized names. Stand-in for the registrations table.
  const [registrations, setRegistrations] = useState<Record<string, string[]>>(
    {},
  );

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
    navigate("/");
  }


  // Temporary: stands in for the register mutation. All rules live in validateRegistration.
  function handleRegister(eventId: string, name: string): RegisterResult {
    const event = events.find((e) => e.id === eventId);
    const result = validateRegistration(
      event,
      registrations[eventId] ?? [],
      name,
    );
    if (result.ok) {
      setRegistrations((prev) => ({
        ...prev,
        [eventId]: [...(prev[eventId] ?? []), normalizeName(name)],
      }));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, registeredCount: e.registeredCount + 1 }
            : e,
        ),
      );
    }
    return result;
  }

  return (
    <main style={{ padding: 24 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Link to="/">Calendar</Link>
        <Link to="/events/new">Create event</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <EventCalendar
              events={events}
              templates={templates}
              onOpenEvent={(id) => navigate(`/events/${id}`)}
            />
          }
        />
        <Route
          path="/events/new"
          element={<EventForm templates={templates} onSubmit={handleCreate} />}
        />
        <Route
          path="/events/:id"
          element={<EventDetailRoute events={events} templates={templates} />}
        />
        <Route
          path="/events/:id/register"
          element={
            <RegisterRoute events={events} onRegister={handleRegister} />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}
