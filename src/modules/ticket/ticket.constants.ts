// Cookie constants live apart from ticket.service so that reading them costs nothing.
//
// ticket.service pulls in prisma, better-auth and — via notification.publish — the
// RabbitMQ client. Importing it just to learn a cookie *name* dragged all of that into
// whatever module did the importing; for API route handlers that also means Vite's dep
// scanner pre-bundles those server-only packages for the browser. Keep this file free
// of imports so it stays safe to reference from anywhere.
export const TICKET_COOKIE_NAME = "ticketReferenceNumber";
export const TICKET_COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day
export const TICKET_COOKIE_PATH = "/";

// Rate limits for the project widget's public endpoints. A `projectId` is not a secret —
// it sits in the embed URL on the client's own site — so these endpoints are exactly as
// scriptable as the global intake chat and get the same treatment.
export const TICKET_RATE_LIMIT = {
  /** New conversations per client per window. */
  SESSIONS_PER_WINDOW: 3,
  SESSION_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  /** Reference-number lookups per client per window — the enumeration surface. */
  LOOKUPS_PER_WINDOW: 10,
  LOOKUP_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  /** Messages per conversation per window. */
  MESSAGES_PER_WINDOW: 30,
  MESSAGE_WINDOW_MS: 60 * 1000, // 1 minute
} as const;
