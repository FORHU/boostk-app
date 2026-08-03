import { prisma } from "@/lib/prisma";
import type { CreateTicketInput } from "./ticket.schema";
import { generateTicketReferenceNumber } from "./ticket.utils";

const MAX_REFERENCE_ATTEMPTS = 5;

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
