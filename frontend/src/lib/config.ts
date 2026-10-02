// Stand-in for store settings. Later these come from the server/env.
export const STORE = {
  name: "Your Store Name",
  address: "123 Main St, Your City, ST 00000",
  timeZone: "America/Los_Angeles", // IANA zone of the store, NOT the viewer's browser
};

function requireUrl(name: string, value: string): string {
  if (!/^https?:\/\//.test(value)) {
    throw new Error(
      `${name} must start with http:// or https:// (got "${value}")`,
    );
  }
  return value.replace(/\/$/, "");
}

export const registrationPath = (eventId: string) =>
  `/events/${eventId}/register`;
export const registrationUrl = (eventId: string) =>
  `${PUBLIC_URL}${registrationPath(eventId)}`;

const fromEnv = (v: string | undefined, fallback: string) =>
  v && v.trim() ? v : fallback;

export const API_URL = requireUrl(
  "VITE_API_URL",
  fromEnv(import.meta.env.VITE_API_URL, window.location.origin),
);
export const PUBLIC_URL = requireUrl(
  "VITE_PUBLIC_URL",
  fromEnv(import.meta.env.VITE_PUBLIC_URL, window.location.origin),
);

export const GRAPHQL_URL = `${API_URL}/graphql`;
export const inviteUrl = (eventId: string) =>
  `${API_URL}/events/${eventId}/invite.ics`;