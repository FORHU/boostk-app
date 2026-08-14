import { createServerFn } from "@tanstack/react-start";
import type { Prisma } from "prisma/generated/client";
import { TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { clientKeyFromRequest, rateLimitedResponse } from "@/lib/rate-limit";
import { requestMiddleware } from "@/lib/request.middleware";
import { ORG_ROLE } from "@/modules/auth/roles";
import { publishToProjectAgents, publishToTicketChannel } from "@/modules/notification/notification.publish";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { requireCustomerTicketMiddleware } from "./ticket.middleware";
import { allowWidgetLookup, allowWidgetSession } from "./ticket.rate-limit";
import {
  GetProjectTicketCountsSchema,
  GetProjectTicketsSchema,
  GetTicketByReferenceNumberSchema,
  RateTicketSchema,
  UpsertTicketSessionInput,
} from "./ticket.schema";
import {
  clearTicketCookie,
  createTicketSession,
  getTicketByReferenceNumber,
  getTicketSession,
  setTicketCookie,
} from "./ticket.service";

export const clearTicketCookieFn = createServerFn({ method: "POST" }).handler(async () => {
  clearTicketCookie();
  return { success: true };
});

/**
 * Open a widget conversation, or resume one from its reference number.
 *
 * Both halves are throttled, on separate budgets, because they are abused differently:
 * creating pours junk tickets into a project's inbox, while resuming is a guessing game
 * against other people's reference numbers. The lookup budget is checked BEFORE the
 * database is touched so a wrong guess costs the attacker its slot either way —
 * throttling only failed lookups would leave a valid-code oracle wide open.
 */
export const upsertTicketSessionFn = createServerFn({ method: "POST" })
  .middleware([requestMiddleware])
  .inputValidator(UpsertTicketSessionInput)
  .handler(async ({ data, context }) => {
    const clientKey = clientKeyFromRequest(context.request);

    if (data.referenceNumber) {
      const verdict = allowWidgetLookup(clientKey);
      if (!verdict.allowed) {
        throw rateLimitedResponse(verdict.retryAfterSeconds, "Too many reference numbers tried from this connection.");
      }

      const ticket = await getTicketByReferenceNumber(data.referenceNumber, data.projectId);
      if (!ticket) throw new Error("Invalid ticket reference number");

      setTicketCookie(ticket.referenceNumber);
      return ticket;
    }

    const verdict = allowWidgetSession(clientKey);
    if (!verdict.allowed) {
      throw rateLimitedResponse(verdict.retryAfterSeconds, "Too many conversations started from this connection.");
    }

    return createTicketSession(data);
  });

export const getTicketByReferenceNumberFn = createServerFn({ method: "GET" })
  .inputValidator(GetTicketByReferenceNumberSchema)
  .handler(async ({ data }) => {
    const ticket = await prisma.ticket.findUnique({
      where: { referenceNumber: data.referenceNumber },
      include: {
        customer: true,
      },
    });
    if (!ticket) throw new Error("Ticket not found");

    return ticket;
  });

export const getTicketCookieFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ data }) => {
    return getTicketSession(data.projectId);
  });

// A customer (identified by the ticket cookie scoped to `projectId`) closes their own
// ticket. Customers can only close — reopening stays an agent action. The status change
// is broadcast on the ticket channel (live-updates the customer's widget) and to the
// project's agents (live-updates their dashboards).
export const closeCustomerTicketFn = createServerFn({ method: "POST" })
  .middleware([requireCustomerTicketMiddleware])
  .inputValidator(z.object({ projectId: z.string().min(1), ticketId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const ticket = context.ticket;
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;
    if (ticket.status !== "OPEN") return ticket;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "CLOSED" },
    });

    const statusData = { ticketId: ticket.id, status: updatedTicket.status };

    await Promise.all([
      publishToTicketChannel({
        ticketId: ticket.id,
        event: EventType.TICKET_STATUS_CHANGED,
        data: statusData,
      }),
      publishToProjectAgents({
        projectId: ticket.projectId,
        event: EventType.TICKET_STATUS_CHANGED,
        data: statusData,
      }),
    ]);

    return updatedTicket;
  });

/**
 * Save the customer's CSAT rating for a closed project-widget conversation.
 *
 * Guarded by the ticket cookie — the customer can only ever rate their own ticket.
 * Written once per conversation: an existing score is left untouched, so a reload or
 * double-tap can never overwrite the first rating.
 */
export const rateTicketFn = createServerFn({ method: "POST" })
  .middleware([requireCustomerTicketMiddleware])
  .inputValidator(RateTicketSchema)
  .handler(async ({ data, context }) => {
    const ticket = context.ticket;
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;
    if (ticket.status !== TicketStatus.CLOSED) return null;
    if (ticket.satisfactionScore != null) return ticket;

    return prisma.ticket.update({
      where: { id: ticket.id },
      data: { satisfactionScore: data.score },
    });
  });

// Offset-paginated ticket list. `statusFilter` and `searchQuery` are applied in SQL so
// pagination counts reflect exactly the rows the table shows. Newest tickets come first.
export const getProjectTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(GetProjectTicketsSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const orderBy = (() => {
      switch (data.sort) {
        case "oldest":
          return [{ createdAt: "asc" as const }, { id: "asc" as const }];
        case "priority":
          return [{ priority: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
        default:
          return [{ createdAt: "desc" as const }, { id: "desc" as const }];
      }
    })();

    const where: Prisma.TicketWhereInput = {
      projectId: data.projectId,
      ...(data.statusFilter !== "ALL" ? { status: data.statusFilter } : {}),
      ...(data.searchQuery
        ? {
            OR: [
              { referenceNumber: { contains: data.searchQuery, mode: "insensitive" } },
              { customer: { is: { name: { contains: data.searchQuery, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          customer: true,
          assignedAgent: { include: { user: true } },
        },
        orderBy,
        skip: (data.page - 1) * data.pageSize,
        take: data.pageSize,
      }),
    ]);

    return {
      tickets,
      total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: Math.max(1, Math.ceil(total / data.pageSize)),
    };
  });

export const getProjectTicketCountsFn = createServerFn({ method: "GET" })
  .inputValidator(GetProjectTicketCountsSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const [open, closed] = await prisma.$transaction([
      prisma.ticket.count({ where: { projectId: data.projectId, status: "OPEN" } }),
      prisma.ticket.count({ where: { projectId: data.projectId, status: "CLOSED" } }),
    ]);

    return { total: open + closed, open, closed };
  });
