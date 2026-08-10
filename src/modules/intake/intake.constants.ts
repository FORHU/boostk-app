// Constants for the global intake chat. Kept free of imports for the same reason as
// ticket.constants.ts: this is referenced from route files and the browser bundle, and
// pulling in prisma/rabbitmq just to read a cookie name drags server-only packages into
// Vite's dep scan.

// The seeded organization + project that every untriaged global chat lands in.
// Resolved by slug at runtime (see intake.service.ts) rather than by a hardcoded id,
// so the same code works across local, staging and production databases.
export const INTAKE_ORG_SLUG = "boostk";
export const INTAKE_PROJECT_SLUG = "boostk-intake";

// DELIBERATELY a different cookie name from TICKET_COOKIE_NAME.
//
// The project widget's `getTicketSession(projectId)` *clears* its cookie whenever the
// stored reference does not belong to the project being viewed. Sharing one name would
// mean a visitor who opened any project widget silently lost their in-progress global
// conversation — and vice versa. Two names let both sessions coexist.
export const INTAKE_COOKIE_NAME = "intakeTicketReferenceNumber";
export const INTAKE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — intake can wait on triage
export const INTAKE_COOKIE_PATH = "/";

// Rate limits for the public, unauthenticated chat endpoints. Unlike the project widget
// — which at least requires knowing a project id — /chat is discoverable by anyone, so
// these are a launch requirement rather than a nicety.
export const INTAKE_RATE_LIMIT = {
  /** New conversations per IP per window. */
  SESSIONS_PER_WINDOW: 3,
  SESSION_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  /** Messages per intake session per window. */
  MESSAGES_PER_WINDOW: 30,
  MESSAGE_WINDOW_MS: 60 * 1000, // 1 minute
} as const;
