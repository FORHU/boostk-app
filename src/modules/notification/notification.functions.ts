import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/rabbitmq";
import { requireAuthMiddleware, requirePlatformStaffMiddleware } from "@/modules/auth/auth.middleware";
import { hasPlatformRole } from "@/modules/auth/roles";
import { INTAKE_PROJECT_SLUG } from "@/modules/intake/intake.constants";
import { requireTicketAgentMiddleware } from "@/modules/ticket/ticket.middleware";

const SendNotificationMessageSchema = z.object({
  targetRoutingKey: z.string(),
  message: z.object({
    event: z.enum(EventType),
    data: z.any(),
  }),
});

export const sendNotificationMessage = createServerFn({ method: "POST" })
  .inputValidator(SendNotificationMessageSchema)
  .handler(async ({ data }) => {
    try {
      const payload = {
        id: Bun.randomUUIDv7(),
        event: data.message.event,
        data: data.message.data,
      };

      await publishEvent(data.targetRoutingKey, payload);

      return { success: true };
    } catch (error) {
      console.error("[notify] Failed to publish notification message:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

export type UnreadTicketSummary = {
  projectId: string;
  projectSlug: string;
  ticketId: string;
  referenceNumber: string;
  projectName: string;
  customerName: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  sender: string;
  isIntake?: boolean;
};

const MAX_PREVIEW_LENGTH = 80;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function previewContent(content: string, contentType: string): string {
  if (contentType === "FILE") return "Attachment";
  if (contentType === "IMAGE") return "Image";
  return truncate(content, MAX_PREVIEW_LENGTH);
}

export const getUnreadTicketSummaries = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.authSession.user.id;

    const memberships = await prisma.member.findMany({
      where: {
        userId,
        role: { in: ["owner", "admin", "agent"] },
      },
      select: { organizationId: true },
    });

    const orgIds = memberships.map((m) => m.organizationId);

    const unreadMessages = await prisma.ticketMessage.findMany({
      where: {
        ticket: { project: { organizationId: { in: orgIds } } },
        messageReads: { none: { userId } },
      },
      include: {
        ticket: {
          include: { project: true, customer: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    interface GroupEntry {
      ticketId: string;
      referenceNumber: string;
      projectId: string;
      projectSlug: string;
      projectName: string;
      customerName: string;
      messages: { content: string; contentType: string; userId: string | null; createdAt: Date }[];
      isIntake?: boolean;
    }

    const byTicket = new Map<string, GroupEntry>();
    const ticketOrder: string[] = [];

    for (const m of unreadMessages) {
      // biome-ignore lint/suspicious/noExplicitAny: Prisma 7 + accelerate extension masks nested include types
      const t = (m as Record<string, any>).ticket as Record<string, any>;
      const tId: string = t.id;
      if (!byTicket.has(tId)) {
        byTicket.set(tId, {
          ticketId: tId,
          referenceNumber: t.referenceNumber,
          projectId: t.projectId,
          projectSlug: t.project.slug,
          projectName: t.project.name,
          customerName: t.customer.name,
          messages: [],
        });
        ticketOrder.push(tId);
      }
      byTicket.get(tId)?.messages.push({
        content: m.content,
        contentType: m.contentType,
        userId: m.userId,
        createdAt: m.createdAt,
      });
    }

    // Platform staff also see unread messages on intake tickets, which live in the
    // seeded intake project rather than any org the staff member belongs to.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    });

    if (hasPlatformRole(user?.platformRole)) {
      const intakeUnread = await prisma.ticketMessage.findMany({
        where: {
          ticket: { project: { slug: INTAKE_PROJECT_SLUG } },
          messageReads: { none: { userId } },
        },
        include: {
          ticket: {
            include: { project: true, customer: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      for (const m of intakeUnread) {
        // biome-ignore lint/suspicious/noExplicitAny: Prisma 7 + accelerate extension masks nested include types
        const t = (m as Record<string, any>).ticket as Record<string, any>;
        const tId: string = t.id;
        if (!byTicket.has(tId)) {
          byTicket.set(tId, {
            ticketId: tId,
            referenceNumber: t.referenceNumber,
            projectId: t.projectId,
            projectSlug: t.project.slug,
            projectName: t.project.name,
            customerName: t.customer.name,
            messages: [],
            isIntake: true,
          });
          ticketOrder.push(tId);
        }
        byTicket.get(tId)?.messages.push({
          content: m.content,
          contentType: m.contentType,
          userId: m.userId,
          createdAt: m.createdAt,
        });
      }
    }

    return ticketOrder.slice(0, 20).map((ticketId): UnreadTicketSummary => {
      const group = byTicket.get(ticketId) as GroupEntry;
      const last = group.messages[0];
      return {
        projectId: group.projectId,
        projectSlug: group.projectSlug,
        ticketId: group.ticketId,
        referenceNumber: group.referenceNumber,
        projectName: group.projectName,
        customerName: group.customerName,
        unreadCount: group.messages.length,
        lastMessagePreview: previewContent(last.content, last.contentType),
        lastMessageAt: last.createdAt.toISOString(),
        sender: last.userId ? "agent" : "customer",
        isIntake: group.isIntake,
      };
    });
  });

export const markTicketReadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ticketId: z.string() }))
  .middleware([requireTicketAgentMiddleware])
  .handler(async ({ context }) => {
    const userId = context.authSession.user.id;
    const ticketId = context.agentTicket.id;

    const unread = await prisma.ticketMessage.findMany({
      where: {
        ticketId,
        messageReads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { marked: 0 };

    await prisma.messageRead.createMany({
      data: unread.map((m) => ({
        messageId: m.id,
        ticketId,
        userId,
      })),
      skipDuplicates: true,
    });

    return { marked: unread.length };
  });

/**
 * Mark all unread messages in an intake ticket as read.
 *
 * Intake tickets belong to the seeded intake project, and platform staff may not be
 * org members — so `requireTicketAgentMiddleware` (which checks org membership) rejects
 * them. This function uses `requirePlatformStaffMiddleware` instead.
 */
export const markIntakeTicketReadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ticketId: z.string() }))
  .middleware([requirePlatformStaffMiddleware])
  .handler(async ({ data, context }) => {
    const userId = context.authSession.user.id;
    const ticketId = data.ticketId;

    const unread = await prisma.ticketMessage.findMany({
      where: {
        ticketId,
        messageReads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { marked: 0 };

    await prisma.messageRead.createMany({
      data: unread.map((m) => ({
        messageId: m.id,
        ticketId,
        userId,
      })),
      skipDuplicates: true,
    });

    return { marked: unread.length };
  });
