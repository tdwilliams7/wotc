export interface GameTemplate {
  id: string;
  name: string;
  formats: string[];
  defaultDurationMinutes: number;
  defaultCapacity: number;
  maxCapacity: number;
  minPlayers: number;
}

export const templateSeed: GameTemplate[] = [
  {
    id: "mtg",
    name: "Magic: The Gathering",
    formats: ["Standard", "Modern", "Commander", "Booster Draft", "Sealed"],
    defaultDurationMinutes: 180,
    defaultCapacity: 16,
    maxCapacity: 30,
    minPlayers: 4,
  },
  {
    id: "pokemon",
    name: "Pokémon TCG",
    formats: ["Standard", "Expanded", "League Challenge", "Prerelease"],
    defaultDurationMinutes: 240,
    defaultCapacity: 20,
    maxCapacity: 30,
    minPlayers: 6,
  },
  {
    id: "yugioh",
    name: "Yu-Gi-Oh!",
    formats: ["Advanced", "Traditional", "Speed Duel"],
    defaultDurationMinutes: 180,
    defaultCapacity: 12,
    maxCapacity: 24,
    minPlayers: 4,
  },
];
