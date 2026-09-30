import { pool } from "./db";
import { migrate } from "./migrate";
import { upsertTemplates } from "./modules/templates/repo";
import { createEvent } from "./modules/events/service";
import { register } from "./modules/registrations/service";

const events = [
  {
    name: "Friday Night Magic",
    gameId: "mtg",
    format: "Standard",
    startDate: "2026-10-02",
    startTime: "18:00",
    capacity: 16,
    players: 9,
  },
  {
    name: "Commander Night",
    gameId: "mtg",
    format: "Commander",
    startDate: "2026-10-02",
    startTime: "19:00",
    capacity: 12,
    players: 12,
  }, // full
  {
    name: "Pokémon League Challenge",
    gameId: "pokemon",
    format: "League Challenge",
    startDate: "2026-10-04",
    startTime: "13:00",
    capacity: 30,
    players: 22,
  },
  {
    name: "Yu-Gi-Oh! Locals",
    gameId: "yugioh",
    format: "Advanced",
    startDate: "2026-10-06",
    startTime: "17:30",
    capacity: 12,
    players: 3,
  },
  {
    name: "Booster Draft",
    gameId: "mtg",
    format: "Booster Draft",
    startDate: "2026-10-06",
    startTime: "19:00",
    capacity: 8,
    players: 5,
  },
];

await migrate();
await upsertTemplates(pool);

const { rows } = await pool.query("SELECT count(*)::int AS n FROM events");
if (rows[0].n === 0) {
  for (const { players, ...input } of events) {
    const ev = await createEvent(pool, input);
    for (let i = 1; i <= players; i++)
      await register(pool, ev.id, `Player ${i}`);
  }
  console.log(`seeded ${events.length} events`);
} else {
  console.log("events already present, skipping event seed");
}
await pool.end();
