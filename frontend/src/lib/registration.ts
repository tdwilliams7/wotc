import type { EventSummary } from "../types";

export type RegisterErrorCode =
  | "NOT_FOUND"
  | "INVALID_NAME"
  | "DUPLICATE"
  | "EVENT_FULL";
export type RegisterResult =
  | { ok: true }
  | { ok: false; code: RegisterErrorCode; message: string };

export const normalizeName = (n: string) =>
  n.trim().replace(/\s+/g, " ").toLowerCase();

export function validateRegistration(
  event: EventSummary | undefined,
  registeredNames: string[], 
  rawName: string,
): RegisterResult {
  if (!event)
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "This event doesn't exist.",
    };
  const name = normalizeName(rawName);
  if (!name)
    return {
      ok: false,
      code: "INVALID_NAME",
      message: "Please enter your name.",
    };
  // Duplicate is checked before full so an existing player gets the more useful message.
  if (registeredNames.includes(name))
    return {
      ok: false,
      code: "DUPLICATE",
      message: "That name is already registered for this event.",
    };
  if (event.registeredCount >= event.capacity)
    return {
      ok: false,
      code: "EVENT_FULL",
      message: "Sorry, this event is full.",
    };
  return { ok: true };
}
