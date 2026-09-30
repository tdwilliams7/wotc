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