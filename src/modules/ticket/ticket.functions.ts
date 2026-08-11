import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
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

// Cursor-paginated ticket list. `take + 1` detects whether another page exists and
// `nextCursor` is the last returned row's id; `id` breaks ties so a cursor never
// skips or repeats a row. Newest tickets come first.
export const getProjectTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(GetProjectTicketsSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const rows = await prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: {
        customer: true,
        assignedAgent: { include: { user: true } },
      },
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
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
