import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import type { EventSummary } from "../types";
import type { RegisterResult } from "../lib/registration";
import { timeRange } from "../lib/dates";

interface Props {
  event: EventSummary;
  onRegister: (eventId: string, name: string) => RegisterResult;
}

export function RegisterPage({ event, onRegister }: Props) {
  const [name, setName] = useState("");
  const [result, setResult] = useState<RegisterResult | null>(null);

  function handleSubmit(ev: SubmitEvent) {
    ev.preventDefault();
    const r = onRegister(event.id, name);
    setResult(r);
    if (r.ok) setName("");
  }

  const spotsLeft = Math.max(event.capacity - event.registeredCount, 0);

  return (
    <section style={{ maxWidth: 480, display: "grid", gap: 12 }}>
      <h2>Register for {event.name}</h2>
      <div>
        {event.startsAt.slice(0, 10)} ·{" "}
        {timeRange(event.startsAt, event.durationMinutes)}
      </div>
      <div>
        {spotsLeft === 0 ? "This event is full." : `${spotsLeft} spots left`}
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "grid", gap: 12 }}
      >
        <label>
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        {/* Deliberately not disabled when full: the handler is the authority and
            a stale page must get a clear rejection, same as it will from the server. */}
        <button type="submit">Register</button>
      </form>

      {result?.ok && <p role="status">You're registered for {event.name}!</p>}
      {result && !result.ok && <p role="alert">{result.message}</p>}

      <Link to={`/events/${event.id}`}>← Event details</Link>
    </section>
  );
}
