import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { publishToProjectAgents, publishToTicketChannel } from "@/modules/notification/notification.publish";
import { requireProjectRole } from "../project/project.middleware";
import { requireCustomerTicketMiddleware, requireTicketAgentMiddleware } from "../ticket/ticket.middleware";
import { CreateCustomerTicketMessageSchema, CreateTicketMessageSchema } from "./ticket-message.schema";
import { prepareIncomingCustomerText, SUPPORT_LANGUAGE, translateOutgoingMessage } from "./ticket-message.translation";

// Attachment metadata travels with every message so a bubble can render a filename
// and size without a second round trip. The bytes themselves are never selected —
// they are streamed by GET /api/attachments/:id instead.
export const ATTACHMENT_SELECT = { select: { id: true, filename: true, mimeType: true, size: true } } as const;

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

    // Translate inbound customer text into the support language so agents can read it,
    // and remember the customer's own language for replies.
    const translation =
      data.contentType === "TEXT"
        ? await prepareIncomingCustomerText({
            content: data.content,
            ticketId: ticket.id,
            customerId: ticket.customerId,
            customerLanguage: ticket.customer.language,
          })
        : { translatedContent: null, sourceLang: null, targetLang: SUPPORT_LANGUAGE };

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
      assignedAgentId: ticket.assignedAgentId ?? undefined,
    });

    return message;
  });

// Agent-side: read a specific ticket's messages. Guarded by ticket, not just by auth —
// the caller must hold agent-or-above in the organization that owns this ticket.
export const getTicketMessagesByTicketFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ ticketId: z.string().min(1) }))
  .middleware([requireTicketAgentMiddleware])
  .handler(async ({ context }) => {
    return prisma.ticketMessage.findMany({
      where: { ticketId: context.agentTicket.id },
      include: { attachment: ATTACHMENT_SELECT },
      orderBy: { createdAt: "asc" as const },
    });
  });

// Agent-side: aggregate the conversations a single agent has participated in.
// Computed in SQL-land so the Agents page never downloads the whole project's
// chat history just to count one person's replies.
export const getAgentConversationsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string().min(1), userId: z.string().min(1) }))
  // Agent-or-above in the project's own org. Previously any signed-in user could read
  // any project's conversation history by supplying its id.
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const messages = await prisma.ticketMessage.findMany({
      where: { userId: data.userId, ticket: { projectId: data.projectId } },
      select: {
        content: true,
        ticket: {
          select: {
            id: true,
            status: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" as const },
    });

    const chatsByTicket = new Map<string, { id: string; customerName: string; status: string; lastMessage: string }>();

    for (const msg of messages) {
      const ticket = msg.ticket;
      const chat = chatsByTicket.get(ticket.id) ?? {
        id: ticket.id,
        customerName: ticket.customer.name,
        status: ticket.status,
        lastMessage: "",
      };
      chat.lastMessage = msg.content;
      chatsByTicket.set(ticket.id, chat);
    }

    return {
      messagesSentCount: messages.length,
      handledChats: [...chatsByTicket.values()],
    };
  });

// Agent-side: send a reply (written in the support language), translated into the customer's language.
export const createAgentTicketMessageFn = createServerFn({ method: "POST" })
  .inputValidator(CreateTicketMessageSchema)
  // Ticket-scoped, not merely authenticated: the caller must hold agent-or-above in the
  // organization that owns this ticket. `requireAuthMiddleware` alone let any signed-in
  // user post into any tenant's conversation given a ticket id.
  .middleware([requireTicketAgentMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context.authSession.user.id;

    // Already resolved and authorised by the middleware.
    const ticket = context.agentTicket;

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

    // Also broadcast the reply to every agent's `user.<id>` channel so their
    // dashboards (socket room user:<id> / SSE user.<id>.*) refresh the
    // conversation live — the ticket channel above only reaches the customer.
    // The bell only rings for the assigned agent via `notifyUserId`; the sender
    // is excluded so nobody notifies themselves.
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
        content: notificationPreview(data.content, data.contentType, attachment),
        sender: "agent",
        createdAt: message.createdAt.toISOString(),
      },
      assignedAgentId: ticket.assignedAgentId ?? undefined,
      excludeUserId: userId,
    });

    return message;
  });
