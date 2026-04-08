import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CreateCustomerSchema } from "@/modules/customer/customer.schema";
import { generateTicketReferenceNumber } from "@/modules/ticket/ticket.utils";
import { createCustomer } from "../customer/customer.service";
import { requireProjectMiddleware } from "../project/project.middleware";
import { GetTicketByReferenceNumberSchema, UpsertTicketSessionInput } from "./ticket.schema";
import { createTicket, getTicketByReferenceNumber } from "./ticket.service";

// Helper function to manage ticket session cookies
const addTicketToSession = (referenceNumber: string) => {
  // set cookie for 1 day
  setCookie("ticketReferenceNumber", referenceNumber, { maxAge: 60 * 60 * 24, path: "/" });
  const sessionsRaw = getCookie("ticketSessions") || "[]";
  let sessions: string[] = [];
  try {
    sessions = JSON.parse(sessionsRaw);
    if (!Array.isArray(sessions)) sessions = [];
  } catch {
    sessions = [];
  }
  if (!sessions.includes(referenceNumber)) {
    sessions.push(referenceNumber);
    setCookie("ticketSessions", JSON.stringify(sessions), { maxAge: 60 * 60 * 24, path: "/" });
  }
};

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
      referenceNumber: await generateTicketReferenceNumber(),
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      projectId: project.id,
      customerId: customer.id,
    });

    addTicketToSession(ticket.referenceNumber);

    return { customer, ticket };
  });

export const upsertTicketSessionFn = createServerFn({ method: "POST" })
  .inputValidator(UpsertTicketSessionInput)
  .handler(async ({ data }) => {
    if (data.referenceNumber) {
      const ticket = await getTicketByReferenceNumber(data.referenceNumber);
      if (!ticket) throw new Error("Invalid ticket reference number");

      addTicketToSession(ticket.referenceNumber);
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
      referenceNumber: await generateTicketReferenceNumber(),
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      projectId: project.id,
      customerId: customer.id,
    });

    addTicketToSession(ticket.referenceNumber);

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
  .inputValidator(z.object({ value: z.string() }))
  .handler(async ({ data }) => {
    setCookie("ticketReferenceNumber", data.value, {
      maxAge: data.value ? 60 * 60 * 24 : 0, // 1 day if set, else clear
      path: "/",
    });

    console.log("ticketReferenceNumber", getCookie("ticketReferenceNumber"));
    return true;
  });

export const getTicketCookieFn = createServerFn({ method: "GET" }).handler(async () => {
  const ticketReferenceNumber = getCookie("ticketReferenceNumber");
  if (!ticketReferenceNumber) return null;

  const ticket = await prisma.ticket.findUnique({
    where: { referenceNumber: ticketReferenceNumber },
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

export const removeTicketSessionFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ referenceNumber: z.string() }))
  .handler(async ({ data }) => {
    const sessionsRaw = getCookie("ticketSessions") || "[]";
    let sessions: string[] = [];
    try {
      sessions = JSON.parse(sessionsRaw);
      if (!Array.isArray(sessions)) sessions = [];
    } catch {
      sessions = [];
    }

    sessions = sessions.filter((ref) => ref !== data.referenceNumber);
    setCookie("ticketSessions", JSON.stringify(sessions), { maxAge: 60 * 60 * 24, path: "/" });

    const currentTicket = getCookie("ticketReferenceNumber");
    if (currentTicket === data.referenceNumber) {
      setCookie("ticketReferenceNumber", "", { maxAge: 0, path: "/" });
    }
    return true;
  });

export const getTicketSessionsCookieFn = createServerFn({ method: "GET" }).handler(async () => {
  const sessionsRaw = getCookie("ticketSessions") || "[]";
  let sessions: string[] = [];
  try {
    sessions = JSON.parse(sessionsRaw);
    if (!Array.isArray(sessions)) sessions = [];
  } catch {
    sessions = [];
  }

  if (sessions.length === 0) return [];

  const tickets = await prisma.ticket.findMany({
    where: { referenceNumber: { in: sessions } },
    include: {
      customer: true,
    },
  });

  // Preserve the order from the cookie array
  return sessions
    .map((ref) => tickets.find((t) => t.referenceNumber === ref))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
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

export const getAuthUserTicketsFn = createServerFn({ method: "GET" })
  .middleware([requireProjectMiddleware])
  .handler(async ({ context }) => {
    const tickets = await prisma.ticket.findMany({
      where: { projectId: context.project.id },
      include: {
        customer: true,
      },
    });
    return tickets;
  });
