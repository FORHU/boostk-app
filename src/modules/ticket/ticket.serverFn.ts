import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";
import { generateTicketReferenceId } from "./ticket.utils";

const createTicketInputValidator = z.object({
  apiKey: z.string(),
  name: z.string(),
  email: z.string(),
});

export const createTicket = createServerFn({ method: "POST" })
  .inputValidator(createTicketInputValidator)
  .handler(async ({ data }) => {
    const project = await prisma.project.findUnique({
      where: { apiKey: data.apiKey },
    });

    if (!project) {
      throw new Error("Project not found");
    }
    const customer = await prisma.customer.create({
      data: {
        projectId: project.id,
        email: data.email,
        name: data.name,
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

    return ticket;
  });
