import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";
import { EventType } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";
import { generateTicketReferenceId } from "./ticket.utils";

export const getTickets = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().optional(), includeCustomer: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const tickets = await prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: {
        customer: data.includeCustomer,
      },
    });

    return tickets;
  });

const createTicketInputValidator = z.object({
  apiKey: z.string(),
  name: z.string(),
  email: z.string(),
  browserLanguage: z.string().optional(),
});

export const createTicket = createServerFn({ method: "POST" })
  .inputValidator(createTicketInputValidator)
  .handler(async ({ data }) => {
    const project = await prisma.project.findUnique({
      where: { apiKey: data.apiKey },
    });

    if (!project) throw new Error("Project not found");

    const customer = await prisma.customer.create({
      data: {
        projectId: project.id,
        email: data.email,
        name: data.name,
        metadata: data.browserLanguage ? { browserLanguage: data.browserLanguage } : undefined,
      },
    });

    const referenceId = await generateTicketReferenceId();

    const ticket = await prisma.ticket.create({
      data: {
        projectId: project.id,
        customerId: customer.id,
        referenceId,
        status: "OPEN",
      },
      include: {
        customer: true,
      },
    });

    getNotifier().onBroadcast(`project_${project.id}`, ticket, EventType.TICKET_CREATED);

    return ticket;
  });

export const getProjectTickets = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().optional() }))
  .handler(async ({ data }) => {
    // TODO: If authentication/org-level filtering is required, it should be added here.
    // For now, returning tickets filtered by project for the agent view.
    const tickets = await prisma.ticket.findMany({
      where: data.projectId ? { projectId: data.projectId } : undefined,
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tickets;
  });
