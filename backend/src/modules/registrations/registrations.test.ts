import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../db";
import { migrate } from "../../migrate";
import { upsertTemplates } from "../templates/repo";
import { createEvent } from "../events/service";
import { register } from "./service";

let eventId: string;

async function freshEvent(capacity: number) {
  return (
    await createEvent(pool, {
      name: `test-${Date.now()}-${Math.random()}`,
      gameId: "mtg",
      format: "Standard",
      startDate: "2027-01-01",
      startTime: "18:00",
      capacity,
    })
  ).id;
}

beforeAll(async () => {
  await migrate();
  await upsertTemplates(pool);
});

afterAll(async () => {
  await pool.query("DELETE FROM events WHERE name LIKE 'test-%'");
  await pool.end();
});

describe("register", () => {
  it("admits exactly `capacity` players out of 50 concurrent attempts", async () => {
    eventId = await freshEvent(30);
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        register(pool, eventId, `Player ${i}`),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(30);
    expect(
      results.filter((r) => !r.ok && r.code === "EVENT_FULL"),
    ).toHaveLength(20);
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM registrations WHERE event_id = $1",
      [eventId],
    );
    expect(rows[0].n).toBe(30);
  });

  it("gives the last seat to exactly one of many racers", async () => {
    const id = await freshEvent(4);
    for (let i = 0; i < 3; i++) await register(pool, id, `Seed ${i}`);
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => register(pool, id, `Racer ${i}`)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("admits one of many concurrent registrations with the same name", async () => {
    const id = await freshEvent(10);
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        register(pool, id, i % 2 ? "  ANA  lopez" : "ana Lopez"),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.code === "DUPLICATE")).toHaveLength(
      7,
    );
  });

  it("rejects blank names and unknown events", async () => {
    expect(await register(pool, eventId, "   ")).toMatchObject({
      ok: false,
      code: "INVALID_NAME",
    });
    expect(await register(pool, "not-a-uuid", "Ana")).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
  });
});
