import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { requireCustomerTicketMiddleware } from "../ticket/ticket.middleware";
import { CreateCustomerTicketMessageSchema, CreateTicketMessageSchema } from "./ticket-message.schema";
import {
  detectMessageLanguage,
  isSupportLanguage,
  SUPPORT_LANGUAGE,
  shouldDetectLanguage,
  translateIncomingMessage,
  translateOutgoingMessage,
} from "./ticket-message.translation";

export const getTicketMessagesFn = createServerFn({ method: "GET" })
  .middleware([requireCustomerTicketMiddleware])
  .inputValidator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ context }) => {
    const ticket = context.ticket;
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
  .middleware([requireCustomerTicketMiddleware])
  .inputValidator(CreateCustomerTicketMessageSchema)
  .handler(async ({ data, context }) => {
    const ticket = context.ticket;
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;

    // Translate inbound customer text into the support language so agents can read it.
    const translation =
      data.contentType === "TEXT"
        ? await translateIncomingMessage(data.content, { ticketId: ticket.id })
        : { translatedContent: null, sourceLang: null, targetLang: SUPPORT_LANGUAGE };

    // Remember the customer's language so agent replies can be translated back into it.
    // Keep detecting while unknown/English so an initial "hello" doesn't lock English;
    // only store an actual foreign language (English stays null, treated the same for replies).
    if (data.contentType === "TEXT" && shouldDetectLanguage(ticket.customer.language, data.content)) {
      const lang = await detectMessageLanguage(data.content, ticket.id);
      if (lang && !isSupportLanguage(lang)) {
        await prisma.customer.update({ where: { id: ticket.customerId }, data: { language: lang } });
      }
    }

    const message = await prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: data.contentType,
        ticketId: ticket.id,
        customerId: ticket.customerId,
        translatedContent: translation.translatedContent,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
      },
    });

    return message;
  });

// Agent-side: read a specific ticket's messages (auth required).
export const getTicketMessagesByTicketFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ ticketId: z.string().min(1) }))
  .middleware([requireAuthMiddleware])
  .handler(async ({ data }) => {
    return prisma.ticketMessage.findMany({
      where: { ticketId: data.ticketId },
      orderBy: { createdAt: "asc" },
    });
  });

// Agent-side: send a reply (written in the support language), translated into the customer's language.
export const createAgentTicketMessageFn = createServerFn({ method: "POST" })
  .inputValidator(CreateTicketMessageSchema)
  .middleware([requireAuthMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context.authSession.user.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: { customer: true },
    });
    if (!ticket) return null;

    const translation =
      data.contentType === "TEXT"
        ? await translateOutgoingMessage(data.content, {
            ticketId: ticket.id,
            customerLang: ticket.customer.language,
          })
        : { translatedContent: null, sourceLang: null, targetLang: SUPPORT_LANGUAGE };

    return prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: data.contentType,
        ticketId: ticket.id,
        userId,
        translatedContent: translation.translatedContent,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
      },
    });
  });
