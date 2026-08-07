import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { GetTicketByReferenceNumberSchema, UpsertTicketSessionInput } from "./ticket.schema";
import { createTicketSession, getTicketByReferenceNumber, getTicketSession, setTicketCookie, clearTicketCookie } from "./ticket.service";

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

export const getProjectTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const tickets = await prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: {
        customer: true,
      },
    });
    return tickets;
  });
