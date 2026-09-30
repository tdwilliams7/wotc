import { GraphQLError } from "graphql";
import { DateTime } from "luxon";
import { Db } from "../../db";
import { MAX_EVENT_CAPACITY, STORE } from "../../config";
import { getTemplate } from "../templates/repo";

// Same shape as the frontend's EventSummary.
export interface EventDto {
  id: string;
  name: string;
  gameId: string;
  format: string;
  startsAt: string; // "YYYY-MM-DDTHH:mm", store-local
  durationMinutes: number;
  capacity: number;
  registeredCount: number;
}

export interface CreateEventInput {
  name: string;
  gameId: string;
  format: string;
  startDate: string;
  startTime: string;
  durationMinutes?: number | null;
  capacity?: number | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

const SELECT = `
  SELECT e.id, e.name, e.game_id, e.format, e.starts_at, e.duration_minutes, e.capacity,
         (SELECT count(*)::int FROM registrations r WHERE r.event_id = e.id) AS registered_count
  FROM events e`;

const map = (r: any): EventDto => ({
  id: r.id,
  name: r.name,
  gameId: r.game_id,
  format: r.format,
  startsAt: DateTime.fromJSDate(r.starts_at, { zone: STORE.timeZone }).toFormat(
    "yyyy-MM-dd'T'HH:mm",
  ),
  durationMinutes: r.duration_minutes,
  capacity: r.capacity,
  registeredCount: r.registered_count,
});

export async function listEvents(db: Db): Promise<EventDto[]> {
  const { rows } = await db.query(`${SELECT} ORDER BY e.starts_at`);
  return rows.map(map);
}

export async function getEvent(db: Db, id: string): Promise<EventDto | null> {
  if (!isUuid(id)) return null;
  const { rows } = await db.query(`${SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ? map(rows[0]) : null;
}

const bad = (message: string): never => {
  throw new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
};

export async function createEvent(
  db: Db,
  input: CreateEventInput,
): Promise<EventDto> {
  const name = input.name.trim();
  if (!name) bad("Event name is required.");

  const tpl = await getTemplate(db, input.gameId);
  if (!tpl) return bad("Unknown game type.");
  if (!tpl.formats.includes(input.format))
    bad(`${tpl.name} doesn't support the "${input.format}" format.`);

  const start = DateTime.fromISO(`${input.startDate}T${input.startTime}`, {
    zone: STORE.timeZone,
  });
  if (!start.isValid) bad("Invalid date or time.");

  // Template drives the defaults; explicit values override them.
  const durationMinutes = input.durationMinutes ?? tpl.defaultDurationMinutes;
  const capacity = input.capacity ?? tpl.defaultCapacity;

  if (!Number.isInteger(durationMinutes) || durationMinutes < 15)
    bad("Duration must be at least 15 minutes.");

  const limit = Math.min(tpl.maxCapacity, MAX_EVENT_CAPACITY);
  if (!Number.isInteger(capacity) || capacity > limit)
    bad(`${tpl.name} events allow at most ${limit} players.`);
  if (capacity < tpl.minPlayers)
    bad(
      `Capacity can't be below the minimum of ${tpl.minPlayers} players to start.`,
    );

  const { rows } = await db.query(
    `INSERT INTO events (name, game_id, format, starts_at, duration_minutes, capacity)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [name, tpl.id, input.format, start.toJSDate(), durationMinutes, capacity],
  );
  return (await getEvent(db, rows[0].id))!;
}
