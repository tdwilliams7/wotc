import { describe, it, expect } from "vitest";
import { validateRegistration } from "./registration";
import type { EventSummary } from "../types";

const event = (registeredCount: number, capacity = 2): EventSummary => ({
  id: "1",
  name: "Test",
  gameId: "mtg",
  format: "Standard",
  startsAt: "2026-10-03T18:00",
  durationMinutes: 60,
  capacity,
  registeredCount,
});

describe("validateRegistration", () => {
  it("accepts when there is room", () => {
    expect(validateRegistration(event(1), [], "Ana").ok).toBe(true);
  });
  it("rejects when full", () => {
    const r = validateRegistration(event(2), [], "Ana");
    expect(r).toMatchObject({ ok: false, code: "EVENT_FULL" });
  });
  it("rejects duplicates regardless of case and spacing", () => {
    const r = validateRegistration(event(1), ["ana lopez"], "  ANA   Lopez ");
    expect(r).toMatchObject({ ok: false, code: "DUPLICATE" });
  });
  it("rejects blank names and unknown events", () => {
    expect(validateRegistration(event(0), [], "   ")).toMatchObject({
      code: "INVALID_NAME",
    });
    expect(validateRegistration(undefined, [], "Ana")).toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
