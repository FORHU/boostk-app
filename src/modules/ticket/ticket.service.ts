import { prisma } from "@/lib/prisma";
import type { CreateTicketInput } from "./ticket.schema";

export const createTicket = async (data: CreateTicketInput) => {
  const ticket = await prisma.ticket.create({
    data: {
      referenceNumber: data.referenceNumber,
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      customerId: data.customerId,
    },
  });

  return ticket;
};

export const getTicketByReferenceNumber = async (referenceNumber: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { referenceNumber },
    include: {
      customer: true,
    },
  });

  return ticket;
};
