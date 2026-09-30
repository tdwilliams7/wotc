import { useMutation, useQuery } from "@apollo/client";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { EventForm } from "./components/EventForm";
import { EventCalendar } from "./components/EventCalendar";
import { EventDetail } from "./components/EventDetail";
import { RegisterPage } from "./components/RegisterPage";
import type {
  CreateEventInput,
  EventSummary,
  GameTemplate,
  RegisterResult,
} from "./types";
import {
  CREATE_EVENT,
  EVENTS_QUERY,
  REGISTER,
  TEMPLATES_QUERY,
} from "./graphql/operations";

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
  onRegister: (eventId: string, name: string) => Promise<RegisterResult>;
}) {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);
  if (!event) return <NotFound />;
  return <RegisterPage event={event} onRegister={onRegister} />;
}

export default function App() {
  const navigate = useNavigate();
  const tplQuery = useQuery<{ templates: GameTemplate[] }>(TEMPLATES_QUERY);
  // cache-and-network: show cached data instantly but always refresh, so spots-left is current.
  const evQuery = useQuery<{ events: EventSummary[] }>(EVENTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [createEventMutation] = useMutation(CREATE_EVENT);
  const [registerMutation] = useMutation(REGISTER);

  const templates = tplQuery.data?.templates;
  const events = evQuery.data?.events;

  // Throws on failure so the form can show the server's message.
  async function handleCreate(input: CreateEventInput) {
    await createEventMutation({
      variables: { input },
      refetchQueries: [{ query: EVENTS_QUERY }],
      awaitRefetchQueries: true,
    });
    navigate("/");
  }

  // Full/duplicate come back as typed data (RegisterError), not exceptions.
  async function handleRegister(
    eventId: string,
    name: string,
  ): Promise<RegisterResult> {
    const { data } = await registerMutation({ variables: { eventId, name } });
    const r = data.register;
    return r.__typename === "RegisterSuccess"
      ? { ok: true }
      : { ok: false, code: r.code, message: r.message };
  }

  const error = tplQuery.error ?? evQuery.error;
  if (!templates || !events) {
    if (error) {
      return (
        <main style={{ padding: 24 }}>
          <p role="alert">Couldn't reach the API: {error.message}</p>
          <p>Is the backend running?</p>
        </main>
      );
    }
    return <main style={{ padding: 24 }}>Loading…</main>;
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
