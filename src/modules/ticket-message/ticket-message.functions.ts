import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { publishToProjectAgents, publishToTicketChannel } from "@/modules/notification/notification.publish";
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

// Attachment metadata travels with every message so a bubble can render a filename
// and size without a second round trip. The bytes themselves are never selected —
// they are streamed by GET /api/attachments/:id instead.
const ATTACHMENT_SELECT = { select: { id: true, filename: true, mimeType: true, size: true } } as const;

/**
 * Confirm an attachment exists and belongs to this ticket before a message points at
 * it, so a caller who is legitimately in one conversation cannot graft a file from
 * another onto their own message. Returns the display label for notifications.
 */
const resolveMessageAttachment = async (attachmentId: string, ticketId: string) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, filename: true, ticketId: true },
  });
  if (!attachment || attachment.ticketId !== ticketId) return null;
  return attachment;
};

/**
 * What a notification shows for a message. For attachments `content` is a URL, which
 * is useless in a toast or a push — send the filename instead.
 */
const notificationPreview = (content: string, contentType: string, attachment: { filename: string } | null) =>
  attachment ? `${contentType === "IMAGE" ? "📷" : "📎"} ${attachment.filename}` : content;

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
      include: { attachment: ATTACHMENT_SELECT },
      // Pinned: an inline literal here widens to `string` and collapses the `include`
      // payload type back to plain scalars.
      orderBy: {
        createdAt: "asc" as const,
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

    const attachment = data.attachmentId ? await resolveMessageAttachment(data.attachmentId, ticket.id) : null;
    if (data.attachmentId && !attachment) return null;

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
        attachmentId: attachment?.id ?? null,
        translatedContent: translation.translatedContent,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
      },
      include: { attachment: ATTACHMENT_SELECT },
    });

    const project = await prisma.project.findUnique({
      where: { id: ticket.projectId },
      select: { name: true },
    });

    await publishToProjectAgents({
      projectId: ticket.projectId,
      event: EventType.CHAT_MESSAGE,
      data: {
        ticketId: ticket.id,
        referenceNumber: ticket.referenceNumber,
        projectId: ticket.projectId,
        projectName: project?.name ?? "",
        customerName: ticket.customer.name,
        customerEmail: ticket.customer.email,
        content: notificationPreview(data.content, data.contentType, attachment),
        sender: "customer",
        createdAt: message.createdAt.toISOString(),
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
      include: { attachment: ATTACHMENT_SELECT },
      orderBy: { createdAt: "asc" as const },
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

    const attachment = data.attachmentId ? await resolveMessageAttachment(data.attachmentId, ticket.id) : null;
    if (data.attachmentId && !attachment) return null;

    const translation =
      data.contentType === "TEXT"
        ? await translateOutgoingMessage(data.content, {
            ticketId: ticket.id,
            customerLang: ticket.customer.language,
          })
        : { translatedContent: null, sourceLang: null, targetLang: SUPPORT_LANGUAGE };

    const message = await prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: data.contentType,
        ticketId: ticket.id,
        userId,
        attachmentId: attachment?.id ?? null,
        translatedContent: translation.translatedContent,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
      },
      include: { attachment: ATTACHMENT_SELECT },
    });

    await publishToTicketChannel({
      ticketId: ticket.id,
      event: EventType.CHAT_MESSAGE,
      data: {
        ticketId: ticket.id,
        referenceNumber: ticket.referenceNumber,
        projectId: ticket.projectId,
        customerName: ticket.customer.name,
        content: notificationPreview(data.content, data.contentType, attachment),
        sender: "agent",
        createdAt: message.createdAt.toISOString(),
      },
    });

    return message;
  });
