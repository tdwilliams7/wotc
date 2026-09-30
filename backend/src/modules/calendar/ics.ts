import { createEvent, DateArray } from "ics";
import { DateTime } from "luxon";
import { EventDto } from "../events/service";
import { GameTemplate } from "../templates/data";
import { STORE } from "../../config";

const toUtcArray = (dt: DateTime): DateArray => {
  const u = dt.toUTC();
  return [u.year, u.month, u.day, u.hour, u.minute];
};

export function buildIcs(event: EventDto, template?: GameTemplate): string {
  const start = DateTime.fromISO(event.startsAt, { zone: STORE.timeZone });
  if (!start.isValid) throw new Error(`Invalid event start: ${event.startsAt}`);
  const end = start.plus({ minutes: event.durationMinutes });

  const { error, value } = createEvent({
    uid: `${event.id}@events.example`,
    productId: "tabletop-events",
    title: event.name,
    description: `${template?.name ?? event.gameId} · ${event.format}`,
    location: `${STORE.name}, ${STORE.address}`,
    start: toUtcArray(start),
    startInputType: "utc",
    startOutputType: "utc",
    end: toUtcArray(end),
    endInputType: "utc",
    endOutputType: "utc",
  });
  if (error || !value) throw error ?? new Error("Failed to build ICS");
  return value;
}
