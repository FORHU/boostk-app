import { Elysia } from "elysia";
import z from "zod";
import { EventType, type Message } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";

export const notificationController = new Elysia({ prefix: "/notification" })
  .post(
    "broadcast/:channelId",
    ({ body, params: { channelId } }) => {
      console.log(`[Notification Controller] Received manual broadcast for channel ${channelId}. Event: ${body.event}`);
      getNotifier().onBroadcast(channelId, body.data, body.event);
      return { success: true };
    },
    {
      body: z.object({
        data: z.any(),
        event: z.enum(EventType),
      }),
    },
  )
  .post(
    "active-topics/add",
    ({ body }) => {
      const { agentId, topicId } = body;
      console.log(`[Notification Controller] Agent ${agentId} subscribing to topic ${topicId}`);
      getNotifier().subscribeUserToTopic(agentId, topicId);
      return { success: true };
    },
    {
      body: z.object({
        agentId: z.string(),
        topicId: z.string(),
      }),
    },
  )
  .post(
    "active-topics/remove",
    ({ body }) => {
      const { agentId, topicId } = body;
      console.log(`[Notification Controller] Agent ${agentId} unsubscribing from topic ${topicId}`);
      getNotifier().unsubscribeUserFromTopic(agentId, topicId);
      return { success: true };
    },
    {
      body: z.object({
        agentId: z.string(),
        topicId: z.string(),
      }),
    },
  )
  .get("listen/:channelId", ({ query, headers, params: { channelId }, set }) => {
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";
    set.headers.Connection = "keep-alive";

    const lastEventId = (query.lastEventId as string | undefined) || headers["last-event-id"];
    const notifier = getNotifier();

    // Variables held in closure so cancel() can access them
    let heartbeatInterval: Timer | NodeJS.Timeout;
    let streamListener: (data: Message) => void;

    const stream = new ReadableStream({
      start(controller) {
        console.log(
          `[Notification Controller] Stream established for ${channelId} (LastEventId: ${lastEventId || "none"})`,
        );

        // Send initial connection message. Notice we omit "event:" so the worker's onmessage catches it.
        controller.enqueue(
          `data: ${JSON.stringify({ event: "system", data: "connected", timestamp: Date.now() })}\n\n`,
        );

        // 1. Define a direct listener. No promises, no loops. Immediate pass-through.
        streamListener = (message: Message) => {
          try {
            // FIX: Stringify the ENTIRE message object, not just message.data.
            // This matches the worker's expectation: JSON.parse(e.data) -> Message
            const payload = JSON.stringify(message);

            // FIX: We omit "event:" line so it defaults to "message" and triggers Worker's onmessage
            controller.enqueue(`id: ${message.id}\ndata: ${payload}\n\n`);
          } catch (err) {
            console.error(`[SSE API] Failed to enqueue message for ${channelId}`, err);
          }
        };

        // 2. Setup standard heartbeat without blocking the thread
        heartbeatInterval = setInterval(() => {
          try {
            const payload = JSON.stringify({ event: "heartbeat", timestamp: Date.now() });
            controller.enqueue(`data: ${payload}\n\n`);
          } catch (e) {
            clearInterval(heartbeatInterval);
          }
        }, 5000);

        // 3. Subscribe LAST, so if the notifier immediately flushes buffered events,
        // the streamListener and controller are already fully initialized to catch them.
        notifier.subscribe(channelId, streamListener, lastEventId);
      },
      cancel() {
        console.log(`[SSE API] Client disconnected from ${channelId}`);
        clearInterval(heartbeatInterval);
        notifier.unsubscribe(channelId, streamListener);
      },
    });

    return new Response(stream);
  });
