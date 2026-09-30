import type { EventSummary } from "../types";
import { localIso } from "../lib/dates";

// Relative to today so the current month always has data.
export const mockEvents: EventSummary[] = [
  {
    id: "1",
    name: "Friday Night Magic",
    gameId: "mtg",
    format: "Standard",
    startsAt: localIso(1, "18:00"),
    durationMinutes: 180,
    capacity: 16,
    registeredCount: 9,
  },
  {
    id: "2",
    name: "Commander Night",
    gameId: "mtg",
    format: "Commander",
    startsAt: localIso(1, "19:00"),
    durationMinutes: 240,
    capacity: 12,
    registeredCount: 12,
  }, // full
  {
    id: "3",
    name: "Pokémon League Challenge",
    gameId: "pokemon",
    format: "League Challenge",
    startsAt: localIso(3, "13:00"),
    durationMinutes: 240,
    capacity: 30,
    registeredCount: 22,
  },
  {
    id: "4",
    name: "Yu-Gi-Oh! Locals",
    gameId: "yugioh",
    format: "Advanced",
    startsAt: localIso(5, "17:30"),
    durationMinutes: 180,
    capacity: 12,
    registeredCount: 3,
  },
  {
    id: "5",
    name: "Booster Draft",
    gameId: "mtg",
    format: "Booster Draft",
    startsAt: localIso(5, "19:00"),
    durationMinutes: 180,
    capacity: 8,
    registeredCount: 5,
  },
  {
    id: "6",
    name: "Prerelease Weekend",
    gameId: "pokemon",
    format: "Prerelease",
    startsAt: localIso(9, "11:00"),
    durationMinutes: 300,
    capacity: 30,
    registeredCount: 4,
  },
];
