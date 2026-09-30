import { Pool } from "pg";
import { getEvent, isUuid, EventDto } from "../events/service";

export type RegisterErrorCode =
  | "NOT_FOUND"
  | "INVALID_NAME"
  | "DUPLICATE"
  | "EVENT_FULL";
export type RegisterOutcome =
  | { ok: true; event: EventDto }
  | { ok: false; code: RegisterErrorCode; message: string };

const fail = (code: RegisterErrorCode, message: string): RegisterOutcome => ({
  ok: false,
  code,
  message,
});

// Same normalization as the frontend's normalizeName.
const normalize = (n: string) => n.trim().replace(/\s+/g, " ").toLowerCase();

export async function register(
  pool: Pool,
  eventId: string,
  rawName: string,
): Promise<RegisterOutcome> {
  const playerName = rawName.trim().replace(/\s+/g, " ");
  const normalized = normalize(rawName);
  if (!normalized) return fail("INVALID_NAME", "Please enter your name.");
  if (!isUuid(eventId)) return fail("NOT_FOUND", "This event doesn't exist.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Row lock: concurrent registrations for THIS event queue here. Once we hold
    // the lock, the count below reflects every registration committed before us.
    const ev = await client.query(
      "SELECT capacity FROM events WHERE id = $1 FOR UPDATE",
      [eventId],
    );
    if (!ev.rowCount) {
      await client.query("ROLLBACK");
      return fail("NOT_FOUND", "This event doesn't exist.");
    }

    // Duplicate before full, so an existing player gets the more useful message.
    const dup = await client.query(
      "SELECT 1 FROM registrations WHERE event_id = $1 AND normalized_name = $2",
      [eventId, normalized],
    );
    if (dup.rowCount) {
      await client.query("ROLLBACK");
      return fail(
        "DUPLICATE",
        "That name is already registered for this event.",
      );
    }

    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM registrations WHERE event_id = $1",
      [eventId],
    );
    if (rows[0].n >= ev.rows[0].capacity) {
      await client.query("ROLLBACK");
      return fail("EVENT_FULL", "Sorry, this event is full.");
    }

    await client.query(
      "INSERT INTO registrations (event_id, player_name, normalized_name) VALUES ($1,$2,$3)",
      [eventId, playerName, normalized],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { ok: true, event: (await getEvent(pool, eventId))! };
}
