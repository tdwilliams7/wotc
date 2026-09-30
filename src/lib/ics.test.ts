import { describe, it, expect } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  it("converts store-local time to UTC and computes the end time", () => {
    const ics = buildIcs({
      id: "1",
      name: "Friday Night Magic",
      gameId: "mtg",
      format: "Standard",
      startsAt: "2026-10-03T18:00",
      durationMinutes: 180,
      capacity: 16,
      registeredCount: 0,
    });
    // 18:00 PDT (UTC-7) -> 01:00Z next day; assumes STORE.timeZone = America/Los_Angeles
    expect(ics).toContain("DTSTART:20261004T010000Z");
    expect(ics).toContain("DTEND:20261004T040000Z");
    expect(ics).toContain("SUMMARY:Friday Night Magic");
    expect(ics).toContain("LOCATION:");
  });
});
