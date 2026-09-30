import { createEvent, type DateArray } from "ics";
import { DateTime } from "luxon";
import type { EventSummary, GameTemplate } from "../types";
import { STORE } from "./config";

const toUtcArray = (dt: DateTime): DateArray => {
  const u = dt.toUTC();
  return [u.year, u.month, u.day, u.hour, u.minute];
};

export function buildIcs(event: EventSummary, template?: GameTemplate): string {
  // "2026-10-03T18:00" is store-local: interpret it in the store's zone.
  const start = DateTime.fromISO(event.startsAt, { zone: STORE.timeZone });
  if (!start.isValid) throw new Error(`Invalid event start: ${event.startsAt}`);
  const end = start.plus({ minutes: event.durationMinutes });

  const { error, value } = createEvent({
    // Stable UID so re-importing updates the entry instead of duplicating it.
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

export function downloadIcs(event: EventSummary, template?: GameTemplate) {
  const blob = new Blob([buildIcs(event, template)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
