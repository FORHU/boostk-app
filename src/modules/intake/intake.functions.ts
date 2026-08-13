import { createServerFn } from "@tanstack/react-start";
import { TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { rateLimitedResponse } from "@/lib/rate-limit";
import { requestMiddleware } from "@/lib/request.middleware";
import { requireAuthMiddleware, requirePlatformStaffMiddleware } from "@/modules/auth/auth.middleware";
import { hasPlatformRole } from "@/modules/auth/roles";
import {
  publishToPlatformStaff,
  publishToProjectAgents,
  publishToTicketChannel,
} from "@/modules/notification/notification.publish";
import { ATTACHMENT_SELECT, notificationPreview } from "@/modules/ticket-message/ticket-message.functions";
import {
  detectMessageLanguage,
  isSupportLanguage,
  SUPPORT_LANGUAGE,
  shouldDetectLanguage,
  translateIncomingMessage,
  translateOutgoingMessage,
} from "@/modules/ticket-message/ticket-message.translation";
import { requireIntakeTicketMiddleware } from "./intake.middleware";
import { allowIntakeMessage, allowIntakeSession, clientKeyFromRequest } from "./intake.rate-limit";
import {
  CloseIntakeTicketSchema,
  CreateIntakeMessageSchema,
  CreateTriageMessageSchema,
  GetTriageQueueSchema,
  RateIntakeTicketSchema,
  RouteIntakeTicketSchema,
  StartIntakeChatSchema,
} from "./intake.schema";
import {
  clearIntakeCookie,
  closeIntakeTicket,
  getTriageQueue,
  getTriageTargets,
  getTriageThread,
  resolveIntakeProjectId,
  routeIntakeTicket,
  startIntakeSession,
} from "./intake.service";

/**
 * Confirm an attachment exists and belongs to this conversation before a message points
 * at it. Mirrors `resolveMessageAttachment` on the widget side: the upload route already
 * checked the caller may write to this ticket, but nothing stops them from then quoting
 * some other ticket's attachment id in the message body.
 */
const resolveIntakeAttachment = async (attachmentId: string, ticketId: string) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, filename: true, ticketId: true },
  });
  if (!attachment || attachment.ticketId !== ticketId) return null;
  return attachment;
};

// ---------------------------------------------------------------------------
// Public — visitor side. No auth; guarded by rate limits and the cookie only.
// ---------------------------------------------------------------------------

export const getIntakeSessionFn = createServerFn({ method: "GET" })
  .middleware([requireIntakeTicketMiddleware])
  .handler(async ({ context }) => context.intakeTicket);

export const startIntakeChatFn = createServerFn({ method: "POST" })
  .middleware([requestMiddleware])
  .inputValidator(StartIntakeChatSchema)
  .handler(async ({ data, context }) => {
    const verdict = allowIntakeSession(clientKeyFromRequest(context.request));
    if (!verdict.allowed) {
      throw rateLimitedResponse(verdict.retryAfterSeconds, "Too many conversations started from this connection.");
    }

    return startIntakeSession(data);
  });

export const clearIntakeCookieFn = createServerFn({ method: "POST" }).handler(async () => {
  clearIntakeCookie();
  return { success: true };
});

export const getIntakeMessagesFn = createServerFn({ method: "GET" })
  .middleware([requireIntakeTicketMiddleware])
  .handler(async ({ context }) => {
    const ticket = context.intakeTicket;
    if (!ticket) return [];

    return prisma.ticketMessage.findMany({
      where: { ticketId: ticket.id },
      include: { attachment: ATTACHMENT_SELECT },
      // Pinned: an inline literal widens to `string` and collapses the `include`
      // payload type back to plain scalars.
      orderBy: { createdAt: "asc" as const },
    });
  });

/**
 * Send a message in a global conversation.
 *
 * Notification routing depends on where the ticket currently lives: while it is still in
 * the intake queue nobody owns it, so BOOSTK staff are notified; once triage has routed
 * it the ticket sits in a real project and its org's agents take over. The visitor's UI
 * is identical either way — they never learn a handoff happened.
 */
export const createIntakeMessageFn = createServerFn({ method: "POST" })
  .middleware([requireIntakeTicketMiddleware])
  .inputValidator(CreateIntakeMessageSchema)
  .handler(async ({ data, context }) => {
    const ticket = context.intakeTicket;
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;

    const verdict = allowIntakeMessage(ticket.referenceNumber);
    if (!verdict.allowed) {
      throw rateLimitedResponse(verdict.retryAfterSeconds, "You're sending messages too quickly.");
    }

    // Confirm the attachment belongs to THIS conversation before the message points at
    // it, so a visitor cannot graft a file from another ticket onto their own message.
    const attachment = data.attachmentId ? await resolveIntakeAttachment(data.attachmentId, ticket.id) : null;
    if (data.attachmentId && !attachment) return null;

    const translation =
      data.contentType === "TEXT"
        ? await translateIncomingMessage(data.content, { ticketId: ticket.id })
        : { translatedContent: null, sourceLang: null, targetLang: SUPPORT_LANGUAGE };

    // Detect and store the visitor's language during intake. Without this the customer
    // row copied at routing time carries no language and agent replies to a routed
    // conversation silently stop being translated.
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

    const intakeProjectId = await resolveIntakeProjectId();
    const notification = {
      ticketId: ticket.id,
      referenceNumber: ticket.referenceNumber,
      projectId: ticket.projectId,
      customerName: ticket.customer.name,
      customerEmail: ticket.customer.email,
      // For an attachment `content` is a URL, which is useless in a toast or a push —
      // send the filename instead, matching the widget's notifications.
      content: notificationPreview(data.content, data.contentType, attachment),
      sender: "customer",
      createdAt: message.createdAt.toISOString(),
    };

    if (ticket.projectId === intakeProjectId) {
      await publishToPlatformStaff({
        event: EventType.CHAT_MESSAGE,
        data: { ...notification, projectName: "Global intake", isIntake: true },
      });
    } else {
      await publishToProjectAgents({
        projectId: ticket.projectId,
        event: EventType.CHAT_MESSAGE,
        data: { ...notification, projectName: ticket.project.name },
        assignedAgentId: ticket.assignedAgentId ?? undefined,
      });
    }

    return message;
  });

/**
 * Save the visitor's CSAT rating for a closed conversation.
 *
 * Guarded by the intake cookie — the visitor can only ever rate their own ticket,
 * intake or routed. Written once per conversation: an existing score is left untouched,
 * so a reload or double-tap can never overwrite the first rating.
 */
export const rateIntakeTicketFn = createServerFn({ method: "POST" })
  .middleware([requireIntakeTicketMiddleware])
  .inputValidator(RateIntakeTicketSchema)
  .handler(async ({ data, context }) => {
    const ticket = context.intakeTicket;
    if (!ticket) return null;
    if (ticket.id !== data.ticketId) return null;
    if (ticket.status !== TicketStatus.CLOSED) return null;
    if (ticket.satisfactionScore != null) return ticket;

    return prisma.ticket.update({
      where: { id: ticket.id },
      data: { satisfactionScore: data.score },
    });
  });

// ---------------------------------------------------------------------------
// Triage — BOOSTK staff only. `requirePlatformStaffMiddleware` is what makes the
// deliberately unscoped, cross-tenant reads below safe.
// ---------------------------------------------------------------------------

/**
 * Whether the signed-in user is BOOSTK staff, so the dashboard can show or hide the
 * triage entry point. This is a UI affordance ONLY — every triage server fn re-checks
 * the role itself, so a forged `true` here reveals nothing.
 */
export const getIsPlatformStaffFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.authSession.user.id },
      select: { platformRole: true },
    });

    return hasPlatformRole(user?.platformRole);
  });

export const getTriageQueueFn = createServerFn({ method: "GET" })
  .middleware([requirePlatformStaffMiddleware])
  .inputValidator(GetTriageQueueSchema)
  .handler(async ({ data }) => getTriageQueue(data));

export const getTriageThreadFn = createServerFn({ method: "GET" })
  .middleware([requirePlatformStaffMiddleware])
  .inputValidator(z.object({ intakeTicketId: z.string().min(1) }))
  .handler(async ({ data }) => getTriageThread(data.intakeTicketId));

export const getTriageTargetsFn = createServerFn({ method: "GET" })
  .middleware([requirePlatformStaffMiddleware])
  .handler(async () => getTriageTargets());

/**
 * Reply to a visitor from the triage queue, before the conversation has an organization.
 *
 * This is what makes triage workable at all: "I need help with my booking" does not say
 * which project it belongs to, so staff have to ask before they can route. It also covers
 * the case where no project fits — the person still gets an answer.
 *
 * Scoped to the intake project on purpose. Platform staff can read every tenant's intake,
 * but this must not become a way to post into an arbitrary organization's ticket, so a
 * ticket that has already been routed is rejected: from that point the receiving org's
 * agents own the conversation.
 */
export const createTriageMessageFn = createServerFn({ method: "POST" })
  .middleware([requirePlatformStaffMiddleware])
  .inputValidator(CreateTriageMessageSchema)
  .handler(async ({ data, context }) => {
    const userId = context.authSession.user.id;
    const intakeProjectId = await resolveIntakeProjectId();

    const ticket = await prisma.ticket.findFirst({
      where: { id: data.intakeTicketId, projectId: intakeProjectId, routedAt: null },
      include: { customer: true },
    });
    if (!ticket) throw new Error("Conversation is not in the triage queue.");

    // Staff write in the support language; the visitor may not read it.
    const translation = await translateOutgoingMessage(data.content, {
      ticketId: ticket.id,
      customerLang: ticket.customer.language,
    });

    const message = await prisma.ticketMessage.create({
      data: {
        content: data.content,
        contentType: "TEXT",
        ticketId: ticket.id,
        userId,
        translatedContent: translation.translatedContent,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
      },
      include: { attachment: ATTACHMENT_SELECT },
    });

    // Reaches the visitor's open /chat window.
    await publishToTicketChannel({
      ticketId: ticket.id,
      event: EventType.CHAT_MESSAGE,
      data: {
        ticketId: ticket.id,
        referenceNumber: ticket.referenceNumber,
        projectId: ticket.projectId,
        customerName: ticket.customer.name,
        content: data.content,
        sender: "agent",
        createdAt: message.createdAt.toISOString(),
      },
    });

    // Keeps every other staff member's queue live; the sender is excluded so nobody
    // notifies themselves.
    await publishToPlatformStaff({
      event: EventType.CHAT_MESSAGE,
      data: {
        ticketId: ticket.id,
        referenceNumber: ticket.referenceNumber,
        projectId: ticket.projectId,
        projectName: "Global intake",
        customerName: ticket.customer.name,
        content: data.content,
        sender: "agent",
        isIntake: true,
        createdAt: message.createdAt.toISOString(),
      },
      excludeUserId: userId,
    });

    return message;
  });

export const routeIntakeTicketFn = createServerFn({ method: "POST" })
  .middleware([requirePlatformStaffMiddleware])
  .inputValidator(RouteIntakeTicketSchema)
  .handler(async ({ data, context }) => {
    const routed = await routeIntakeTicket({ ...data, triagedById: context.authSession.user.id });

    // Tell the visitor's open chat window that the conversation moved, so it can
    // reconnect to the new ticket's socket room instead of listening on a closed one.
    await publishToTicketChannel({
      ticketId: data.intakeTicketId,
      event: EventType.TICKET_ROUTED,
      data: {
        ticketId: routed.id,
        referenceNumber: routed.referenceNumber,
        projectId: routed.projectId,
      },
    });

    return routed;
  });

export const closeIntakeTicketFn = createServerFn({ method: "POST" })
  .middleware([requirePlatformStaffMiddleware])
  .inputValidator(CloseIntakeTicketSchema)
  .handler(async ({ data, context }) => closeIntakeTicket({ ...data, triagedById: context.authSession.user.id }));
