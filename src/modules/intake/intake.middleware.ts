import { createMiddleware } from "@tanstack/react-start";
import { getIntakeSession } from "./intake.service";

/**
 * Resolves the visitor's global-chat conversation from their intake cookie.
 *
 * Unlike `requireCustomerTicketMiddleware`, this takes no `projectId`: an intake chat
 * begins with no project at all, and after triage it lives in the receiving org's
 * project. The reference number in the cookie is the credential throughout, so the
 * session survives the move.
 */
export const requireIntakeTicketMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const ticket = await getIntakeSession();
  return next({ context: { intakeTicket: ticket } });
});

/**
 * Surfaces the raw request so rate limiting can derive a client key from proxy headers.
 * `@tanstack/react-start/server` exposes no ambient request accessor in this version, so
 * the request has to travel through middleware context the way `authMiddleware` does it.
 */
export const intakeRequestMiddleware = createMiddleware().server(async ({ next, request }) => {
  return next({ context: { request } });
});
