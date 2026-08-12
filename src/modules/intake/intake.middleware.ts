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
