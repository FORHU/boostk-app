import type { EventType, Message } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/rabbitmq";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";

type NotificationData = Record<string, unknown>;

const buildMessage = (event: EventType, data: NotificationData): Message => ({
  id: crypto.randomUUID(),
  event,
  data,
});

/**
 * Notify every agent (org member with an agent-or-above role) of the project a
 * ticket belongs to. Each agent receives the event on their personal
 * `user.<userId>.<event>` routing key, which their dashboard SSE stream is bound to.
 *
 * When `assignedAgentId` is set, the event data carries `notifyUserId` (the
 * assignee's user id) so clients can ring the notification bell only for the
 * assigned agent while every agent still receives the event for live refresh.
 * `excludeUserId` drops the sender from the recipient list so nobody notifies
 * themselves.
 */
export async function publishToProjectAgents({
  projectId,
  event,
  data,
  assignedAgentId,
  excludeUserId,
}: {
  projectId: string;
  event: EventType;
  data: NotificationData;
  assignedAgentId?: string;
  excludeUserId?: string;
}): Promise<void> {
  try {
    const [project, assignee] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          organization: {
            select: { members: { select: { userId: true, role: true } } },
          },
        },
      }),
      assignedAgentId ? prisma.member.findUnique({ where: { id: assignedAgentId }, select: { userId: true } }) : null,
    ]);

    let agentUserIds =
      project?.organization?.members
        ?.filter(({ role }) => hasOrgRole(role, ORG_ROLE.AGENT))
        .map(({ userId }) => userId) ?? [];
    if (excludeUserId) agentUserIds = agentUserIds.filter((userId) => userId !== excludeUserId);
    if (agentUserIds.length === 0) return;

    const payload = assignee?.userId ? { ...data, notifyUserId: assignee.userId } : data;
    const message = buildMessage(event, payload);
    await Promise.all(agentUserIds.map((userId) => publishEvent(`user.${userId}.${event}`, message)));
  } catch (err) {
    console.error("[notify] Failed to publish event to project agents:", err);
  }
}

/**
 * Publish an event on the `ticket.<ticketId>.<event>` routing key, consumed by the
 * customer's support-chat SSE stream.
 */
export async function publishToTicketChannel({
  ticketId,
  event,
  data,
}: {
  ticketId: string;
  event: EventType;
  data: NotificationData;
}): Promise<void> {
  try {
    await publishEvent(`ticket.${ticketId}.${event}`, buildMessage(event, data));
  } catch (err) {
    console.error("[notify] Failed to publish event to ticket channel:", err);
  }
}
