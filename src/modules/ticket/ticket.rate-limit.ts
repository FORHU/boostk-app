import { createRateLimiter } from "@/lib/rate-limit";
import { TICKET_RATE_LIMIT } from "./ticket.constants";

/**
 * Rate-limit policy for the project widget's public endpoints.
 *
 * Knowing a `projectId` is not a credential — the id sits in the embed URL on the
 * client's own site — so these endpoints are as scriptable as the global intake chat,
 * only less obvious. Same mechanism as intake (`@/lib/rate-limit`), different budgets.
 */

/** New conversations per client. Mirrors the intake session budget. */
const sessionLimiter = createRateLimiter({
  limit: TICKET_RATE_LIMIT.SESSIONS_PER_WINDOW,
  windowMs: TICKET_RATE_LIMIT.SESSION_WINDOW_MS,
});

/**
 * Reference-number lookups per client, kept tighter than the session budget because this
 * is the enumeration surface: `upsertTicketSessionFn` resumes a conversation from a
 * reference number alone, so an unthrottled caller can guess their way into other
 * people's tickets. The codes are unguessable, not secret — this is what makes guessing
 * expensive rather than free.
 */
const lookupLimiter = createRateLimiter({
  limit: TICKET_RATE_LIMIT.LOOKUPS_PER_WINDOW,
  windowMs: TICKET_RATE_LIMIT.LOOKUP_WINDOW_MS,
});

/**
 * Messages per conversation. Keyed on the reference number rather than the client, so a
 * visitor behind a shared NAT is not throttled by a stranger's chatter — the same trade
 * `allowIntakeMessage` makes.
 */
const messageLimiter = createRateLimiter({
  limit: TICKET_RATE_LIMIT.MESSAGES_PER_WINDOW,
  windowMs: TICKET_RATE_LIMIT.MESSAGE_WINDOW_MS,
});

/** Whether this client may start another widget conversation. */
export const allowWidgetSession = (clientKey: string) => sessionLimiter.check(clientKey);

/** Whether this client may try another reference number. */
export const allowWidgetLookup = (clientKey: string) => lookupLimiter.check(clientKey);

/** Whether this conversation may send another message. */
export const allowWidgetMessage = (referenceNumber: string) => messageLimiter.check(referenceNumber);

/** Test seam — resets the in-memory windows. */
export function __resetTicketRateLimits() {
  sessionLimiter.reset();
  lookupLimiter.reset();
  messageLimiter.reset();
}
