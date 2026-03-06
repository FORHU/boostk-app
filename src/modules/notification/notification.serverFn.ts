import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { EventType } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";

export const broadcastNotificationFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      channelId: z.string(),
      data: z.any(),
      event: z.enum(EventType),
    }),
  )
  .handler(async ({ data }) => {
    console.log(
      `[Notification serverFn] Received manual broadcast for channel ${data.channelId}. Event: ${data.event}`,
    );
    getNotifier().onBroadcast(data.channelId, data.data, data.event);
    return { success: true };
  });

export const addActiveTopicFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      agentId: z.string(),
      topicId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    console.log(`[Notification serverFn] Agent ${data.agentId} subscribing to topic ${data.topicId}`);
    getNotifier().subscribeUserToTopic(data.agentId, data.topicId);
    return { success: true };
  });

export const removeActiveTopicFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      agentId: z.string(),
      topicId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    console.log(`[Notification serverFn] Agent ${data.agentId} unsubscribing from topic ${data.topicId}`);
    getNotifier().unsubscribeUserFromTopic(data.agentId, data.topicId);
    return { success: true };
  });
