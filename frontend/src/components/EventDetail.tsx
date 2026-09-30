import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import type { EventSummary, GameTemplate } from "../types";
import { timeRange } from "../lib/dates";
import { downloadIcs } from "../lib/ics";
import { registrationPath, registrationUrl } from "../lib/config";

interface Props {
  event: EventSummary;
  template?: GameTemplate;
}

export function EventDetail({ event, template }: Props) {
  const full = event.registeredCount >= event.capacity;
  const url = registrationUrl(event.id);

  return (
    <section style={{ maxWidth: 480, display: "grid", gap: 8 }}>
      <Link to="/">← Back to calendar</Link>
      <h2>{event.name}</h2>
      <div>
        {template?.name ?? event.gameId} · {event.format}
      </div>
      <div>
        {event.startsAt.slice(0, 10)} ·{" "}
        {timeRange(event.startsAt, event.durationMinutes)}
      </div>
      <div>
        {full ? "Full" : `${event.capacity - event.registeredCount} spots left`}{" "}
        ({event.registeredCount}/{event.capacity})
      </div>
      <button
        onClick={() => downloadIcs(event, template)}
        style={{ justifySelf: "start" }}
      >
        Add to calendar (.ics)
      </button>

      <h3>Register</h3>
      {/* White backing keeps the code scannable in dark mode */}
      <div
        style={{
          background: "#fff",
          padding: 12,
          display: "inline-block",
          justifySelf: "start",
        }}
      >
        <QRCodeSVG value={url} size={192} />
      </div>
      <code style={{ wordBreak: "break-all" }}>{url}</code>
      {/* Router Link (not <a href>) so in-memory mock state survives navigation */}
      <Link to={registrationPath(event.id)}>Open registration form</Link>
    </section>
  );
}
