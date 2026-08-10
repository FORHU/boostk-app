import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { GetTicketByReferenceNumberSchema, UpsertTicketSessionInput } from "./ticket.schema";
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

// Returns every ticket in a project along with the customer rows attached to them — names,
// emails, phone numbers. This had NO middleware at all, so any unauthenticated caller who
// knew (or guessed) a project id could read another tenant's customer list.
export const getProjectTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().min(1) }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const tickets = await prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: {
        customer: true,
      },
    });
    return tickets;
  });
