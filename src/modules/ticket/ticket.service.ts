import { getCookie, setCookie } from "@tanstack/react-start/server";
import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import type { CreateCustomerInput } from "@/modules/customer/customer.schema";
import { publishToProjectAgents } from "@/modules/notification/notification.publish";
import { createCustomer } from "../customer/customer.service";
import { TICKET_COOKIE_MAX_AGE, TICKET_COOKIE_NAME, TICKET_COOKIE_PATH } from "./ticket.constants";
import type { CreateTicketInput } from "./ticket.schema";
import { generateTicketReferenceNumber } from "./ticket.utils";

const MAX_REFERENCE_ATTEMPTS = 5;

// Re-exported so existing callers keep their import path; new server-only callers
// should prefer ./ticket.constants directly.
export { TICKET_COOKIE_MAX_AGE, TICKET_COOKIE_NAME, TICKET_COOKIE_PATH };

export const setTicketCookie = (referenceNumber: string) =>
  setCookie(TICKET_COOKIE_NAME, referenceNumber, {
    maxAge: TICKET_COOKIE_MAX_AGE,
    path: TICKET_COOKIE_PATH,
  });

export const getTicketSession = async (projectId: string) => {
  const ticketReferenceNumber = getCookie(TICKET_COOKIE_NAME);
  if (!ticketReferenceNumber) return null;

  // Scope the session to the project being viewed so a stale cookie from
  // another project's support chat can never resume a foreign conversation.
  const ticket = await prisma.ticket.findFirst({
    where: { referenceNumber: ticketReferenceNumber, projectId },
    include: {
      customer: true,
    },
  });

  if (!ticket) {
    setCookie(TICKET_COOKIE_NAME, "", {
      maxAge: 0,
      path: TICKET_COOKIE_PATH,
    });
    return null;
  }

  return ticket;
};

export const createTicketSession = async (data: CreateCustomerInput) => {
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

  setTicketCookie(ticket.referenceNumber);

  await publishToProjectAgents({
    projectId: project.id,
    event: EventType.TICKET_CREATED,
    data: {
      ticketId: ticket.id,
      referenceNumber: ticket.referenceNumber,
      projectId: project.id,
      projectName: project.name,
      customerName: customer.name,
      customerEmail: customer.email,
      createdAt: ticket.createdAt.toISOString(),
    },
  });

  return { customer, ticket };
};

const isUniqueConstraintError = (error: unknown): error is { code: "P2002"; meta?: { target?: unknown } } =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";

export const createTicket = async (data: CreateTicketInput) => {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    const referenceNumber = generateTicketReferenceNumber();
    try {
      return await prisma.ticket.create({
        data: { ...data, referenceNumber },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error) || !String(error.meta?.target).includes("referenceNumber")) {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate a unique ticket reference number");
};

export const getTicketByReferenceNumber = async (referenceNumber: string, projectId?: string) => {
  const ticket = await prisma.ticket.findFirst({
    where: { referenceNumber, ...(projectId ? { projectId } : {}) },
    include: {
      customer: true,
    },
  });

  return ticket;
};
