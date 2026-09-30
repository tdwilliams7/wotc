export interface GameTemplate {
  id: string;
  name: string;
  formats: string[];
  defaultDurationMinutes: number;
  defaultCapacity: number;
  maxCapacity: number;
  minPlayers: number;
}

export interface CreateEventInput {
  name: string;
  gameId: string;
  format: string;
  startDate: string; // "YYYY-MM-DD" (store-local)
  startTime: string; // "HH:mm" (store-local)
  durationMinutes: number;
  capacity: number;
}

export interface EventSummary {
  id: string;
  name: string;
  gameId: string;
  format: string;
  startsAt: string; // "YYYY-MM-DDTHH:mm", store-local
  durationMinutes: number;
  capacity: number;
  registeredCount: number;
}

export type RegisterErrorCode =
  | "NOT_FOUND"
  | "INVALID_NAME"
  | "DUPLICATE"
  | "EVENT_FULL";
export type RegisterResult =
  | { ok: true }
  | { ok: false; code: RegisterErrorCode; message: string };