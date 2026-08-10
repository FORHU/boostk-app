import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "../auth/auth.middleware";
import { getMemberRole, hasOrgRole, ORG_ROLE } from "../auth/roles";
import { getTicketSession } from "./ticket.service";

export const requireCustomerTicketMiddleware = createMiddleware({ type: "function" }).server(async ({ next, data }) => {
  const result = z.object({ projectId: z.string() }).safeParse(data);
  const ticket = result.success ? await getTicketSession(result.data.projectId) : null;
  console.log("[customerMiddleware] ticket:", ticket?.referenceNumber ?? null); // temporary debug log

  return next({ context: { ticket } });
});

/**
 * Agent-side guard for server functions addressed by `ticketId` alone.
 *
 * `requireProjectRole` cannot be used for these: it reads `projectId` off the request,
 * and these callers only send a ticket id. Resolving the project from the TICKET — never
 * from client input — is the point. It means the caller cannot name a project they happen
 * to belong to while operating on a ticket from someone else's.
 *
 * Without this, `requireAuthMiddleware` alone lets any signed-in user read or write any
 * tenant's conversation given a ticket id.
 *
 * Surfaces the resolved ticket on context so handlers do not re-query it.
 */
export const requireTicketAgentMiddleware = createMiddleware({ type: "function" })
  .middleware([requireAuthMiddleware])
  .server(async ({ next, context, data }) => {
    const result = z.object({ ticketId: z.string() }).safeParse(data);

    if (!result.success) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.SERVER_ERROR } });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: result.data.ticketId },
      include: {
        customer: true,
        project: { include: { organization: { include: { members: true } } } },
      },
    });

    // Same response for "no such ticket" and "not yours" — distinguishing them would let
    // a caller probe which ticket ids exist.
    if (!ticket) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    const role = getMemberRole(ticket.project.organization.members, context.authSession.user.id);
    if (!hasOrgRole(role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    return next({ context: { agentTicket: ticket, role } });
  });
