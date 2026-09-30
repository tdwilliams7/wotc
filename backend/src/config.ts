import process from "process";


export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://events:events@localhost:5433/events";
export const PORT = Number(process.env.PORT ?? 4000);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

// Same values as the frontend's config.ts; the frontend copy goes away once ICS is server-only.
export const STORE = {
  name: "Your Store Name",
  address: "123 Main St, Your City, ST 00000",
  timeZone: "America/Los_Angeles",
};

export const MAX_EVENT_CAPACITY = 30; // from the brief
