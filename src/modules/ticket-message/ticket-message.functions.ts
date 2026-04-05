import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { getTicketCookieFn } from "../ticket/ticket.functions";
import { CreateTicketMessageSchema } from "./ticket-message.schema";

export const getTicketMessagesFn = createServerFn({ method: "GET" })
  // .middleware([]) // TODO: add customer middleware and move ticket cookie to middleware
  .handler(async () => {
    const ticket = await getTicketCookieFn();
    if (!ticket) return [];

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

export const createTicketMessageFn = createServerFn({ method: "POST" })
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
