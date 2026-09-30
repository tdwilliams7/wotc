
// Stand-in for store settings. Later these come from the server/env.
export const STORE = {
  name: "Your Store Name",
  address: "123 Main St, Your City, ST 00000",
  timeZone: "America/Los_Angeles", // IANA zone of the store, NOT the viewer's browser
};

export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const inviteUrl = (eventId: string) =>
  `${API_URL}/events/${eventId}/invite.ics`;

// Base URL encoded into the QR. Comes from env so it works when scanned from a phone.
export const PUBLIC_URL = (
  import.meta.env.VITE_PUBLIC_URL ?? window.location.origin
).replace(/\/$/, "");

export const registrationPath = (eventId: string) =>
  `/events/${eventId}/register`;
export const registrationUrl = (eventId: string) =>
  `${PUBLIC_URL}${registrationPath(eventId)}`;