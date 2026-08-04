import type { EventType, Message } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/rabbitmq";

type NotificationData = Record<string, unknown>;

const buildMessage = (event: EventType, data: NotificationData): Message => ({
  id: crypto.randomUUID(),
  event,
  data,
});

/**
 * Notify every agent (org member) of the project a ticket belongs to.
 * Each agent receives the event on their personal `user.<userId>.<event>` routing key,
 * which their dashboard SSE stream is bound to.
 */
export async function publishToProjectAgents({
  projectId,
  event,
  data,
}: {
  projectId: string;
  event: EventType;
  data: NotificationData;
}): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        organization: { select: { members: { select: { userId: true } } } },
      },
    });
    const agentUserIds = project?.organization?.members?.map(({ userId }) => userId) ?? [];
    if (agentUserIds.length === 0) return;

    const message = buildMessage(event, data);
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
