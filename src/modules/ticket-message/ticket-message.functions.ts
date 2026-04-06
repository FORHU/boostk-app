import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "../auth/auth.middleware";
import { getTicketCookieFn } from "../ticket/ticket.functions";
import { CreateTicketMessageSchema } from "./ticket-message.schema";

export const getTicketMessagesFn = createServerFn({ method: "GET" })
  // .middleware([]) // TODO: add customer middleware and move ticket cookie to middleware
  .inputValidator(z.string())
  .handler(async ({ data: ticketId }) => {
    const messages = await prisma.ticketMessage.findMany({
      where: {
        ticketId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  });

export const createCustomerTicketMessageFn = createServerFn({ method: "POST" })
  .inputValidator(CreateTicketMessageSchema)
  .handler(async ({ data }) => {
    const ticket = await getTicketCookieFn();
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;

    const message = await prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: data.contentType,
        ticketId: ticket.id,
        customerId: ticket.customerId,
      },
    });

    return message;
  });

export const getCustomerTicketMessagesFn = createServerFn({ method: "GET" }).handler(async () => {
  const ticket = await getTicketCookieFn();
  if (!ticket) return null;

  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId: ticket.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return messages;
});

export const getUserTicketMessagesFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.string())
  .handler(async ({ data: ticketId }) => {
    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        customer: true,
        user: true,
      },
    });

    return messages;
  });

export const createUserTicketMessageFn = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      ticketId: z.string(),
      content: z.string(),
      contentType: z.enum(["TEXT", "IMAGE", "FILE"]).optional().default("TEXT"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { authSession } = context;

    const message = await prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: data.contentType || "TEXT",
        ticketId: data.ticketId,
        userId: authSession.user.id,
      },
    });

    return message;
  });
