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
