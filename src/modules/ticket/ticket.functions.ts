import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CreateCustomerSchema } from "@/modules/customer/customer.schema";
import { createCustomer } from "../customer/customer.service";
import { GetTicketByReferenceNumberSchema, UpsertTicketSessionInput } from "./ticket.schema";
import { createTicket, getTicketByReferenceNumber } from "./ticket.service";

// TODO: clean up createTicketFn and upsertTicketSessionFn
export const createTicketFn = createServerFn({ method: "POST" })
  .inputValidator(CreateCustomerSchema)
  .handler(async ({ data }) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) throw new Error("Project not found");

    const customer = await createCustomer({
      name: data.name,
      email: data.email,
      phone: data.phone,
      metadata: data.metadata,
      projectId: project.id,
    });

    const ticket = await createTicket({
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      projectId: project.id,
      customerId: customer.id,
    });

    // set cookie for 1 day
    setCookie("ticketReferenceNumber", ticket.referenceNumber, { maxAge: 60 * 60 * 24 });

    return { customer, ticket };
  });

export const upsertTicketSessionFn = createServerFn({ method: "POST" })
  .inputValidator(UpsertTicketSessionInput)
  .handler(async ({ data }) => {
    if (data.referenceNumber) {
      const ticket = await getTicketByReferenceNumber(data.referenceNumber, data.projectId);
      if (!ticket) throw new Error("Invalid ticket reference number");

      // set cookie for 1 day
      setCookie("ticketReferenceNumber", ticket.referenceNumber, { maxAge: 60 * 60 * 24 });
      return ticket;
    }
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) throw new Error("Project not found");

    const customer = await createCustomer({
      name: data.name,
      email: data.email,
      phone: data.phone,
      metadata: data.metadata,
      projectId: project.id,
    });

    const ticket = await createTicket({
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      projectId: project.id,
      customerId: customer.id,
    });

    // set cookie for 1 day
    setCookie("ticketReferenceNumber", ticket.referenceNumber, { maxAge: 60 * 60 * 24 });

    return { customer, ticket };
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

export const setTicketCookieFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ value: z.string().min(1) }))
  .handler(async ({ data }) => {
    setCookie("ticketReferenceNumber", data.value, {
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    console.log("ticketReferenceNumber", getCookie("ticketReferenceNumber"));
    return true;
  });

export const getTicketCookieFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ticketReferenceNumber = getCookie("ticketReferenceNumber");
    if (!ticketReferenceNumber) return null;

    // Scope the session to the project being viewed so a stale cookie from
    // another project's support chat can never resume a foreign conversation.
    const ticket = await prisma.ticket.findFirst({
      where: { referenceNumber: ticketReferenceNumber, projectId: data.projectId },
      include: {
        customer: true,
      },
    });

    if (!ticket) {
      setCookie("ticketReferenceNumber", "", {
        maxAge: 0,
        path: "/",
      });
      return null;
    }

    return ticket;
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
