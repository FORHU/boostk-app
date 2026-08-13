import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { publishToProjectAgents, publishToTicketChannel } from "@/modules/notification/notification.publish";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { requireCustomerTicketMiddleware } from "./ticket.middleware";
import {
  GetProjectTicketCountsSchema,
  GetProjectTicketsSchema,
  GetTicketByReferenceNumberSchema,
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

export const upsertTicketSessionFn = createServerFn({ method: "POST" })
  .inputValidator(UpsertTicketSessionInput)
  .handler(async ({ data }) => {
    if (data.referenceNumber) {
      const ticket = await getTicketByReferenceNumber(data.referenceNumber, data.projectId);
      if (!ticket) throw new Error("Invalid ticket reference number");

      setTicketCookie(ticket.referenceNumber);
      return ticket;
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

// Cursor-paginated ticket list. `take + 1` detects whether another page exists and
// `nextCursor` is the last returned row's id; `id` breaks ties so a cursor never
// skips or repeats a row. Newest tickets come first.
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

    const rows = await prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: {
        customer: true,
        assignedAgent: { include: { user: true } },
      },
      orderBy,
      take: data.take + 1,
      ...(data.cursor ? { cursor: { id: data.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > data.take;
    const tickets = hasMore ? rows.slice(0, data.take) : rows;

    return {
      tickets,
      nextCursor: hasMore ? tickets[tickets.length - 1].id : null,
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
