import { createRateLimiter } from "@/lib/rate-limit";
import { INTAKE_RATE_LIMIT } from "./intake.constants";

/**
 * Rate-limit policy for the public intake endpoints.
 *
 * `/chat` is unauthenticated and discoverable by anyone, unlike the project widget which
 * at least requires knowing a project id. Without this, a single script can fill the
 * triage queue with junk conversations.
 *
 * The mechanism — fixed windows, bounded key maps, the per-process caveat — lives in
 * `@/lib/rate-limit`. This file only declares the budgets.
 */
const sessionLimiter = createRateLimiter({
  limit: INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW,
  windowMs: INTAKE_RATE_LIMIT.SESSION_WINDOW_MS,
});

const messageLimiter = createRateLimiter({
  limit: INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW,
  windowMs: INTAKE_RATE_LIMIT.MESSAGE_WINDOW_MS,
});

/** Whether this client may open another conversation. */
export const allowIntakeSession = (clientKey: string) => sessionLimiter.check(clientKey);

/** Whether this conversation may send another message. */
export const allowIntakeMessage = (referenceNumber: string) => messageLimiter.check(referenceNumber);

// Re-exported so intake callers keep importing their rate-limit helpers from one place.
export { clientKeyFromRequest } from "@/lib/rate-limit";

/** Test seam — resets the in-memory windows. */
export function __resetIntakeRateLimits() {
  sessionLimiter.reset();
  messageLimiter.reset();
}
