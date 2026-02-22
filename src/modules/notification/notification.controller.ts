import { Elysia } from "elysia";
import z from "zod";
import type { Message } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";

export const notificationController = new Elysia({ prefix: "/notification" })
  .post(
    "broadcast/:channelId",
    ({ body, params: { channelId } }) => {
      console.log("broadcast", channelId, body.message);

      getNotifier().onBroadcast(channelId, body.message);
      return { success: true };
    },
    {
      body: z.object({
        message: z.string(),
      }),
    },
  )
  .get("listen/:channelId", ({ params: { channelId }, set }) => {
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";
    set.headers.Connection = "keep-alive";

    const notifier = getNotifier();

    const stream = new ReadableStream({
      async start(controller) {
        // 1. Setup the listener and resolver
        let resolver: ((value: Message | "__heartbeat__") => void) | null = null;

        const listener = (data: Message) => {
          if (resolver) resolver(data);
        };

        notifier.subscribe(channelId, listener);

        // 2. Send initial connection message
        const initialMsg = `data: ${JSON.stringify({ type: "system", message: "connected", timestamp: Date.now() })}\n\n`;
        controller.enqueue(initialMsg);

        try {
          while (true) {
            // 3. Wait for either a message or a 5s heartbeat timeout
            const message = await Promise.race([
              new Promise<Message | "__heartbeat__">((resolve) => {
                resolver = resolve;
              }),
              new Promise<"__heartbeat__">((resolve) => setTimeout(() => resolve("__heartbeat__"), 5000)),
            ]);

            let payload: string;

            if (message === "__heartbeat__") {
              payload = JSON.stringify({ type: "heartbeat", timestamp: Date.now() });
            } else {
              payload = JSON.stringify(message);
            }

            // 4. Format as SSE data and push to stream
            controller.enqueue(`data: ${payload}\n\n`);
          }
        } catch (e) {
          console.error(`Stream error for ${channelId}:`, e);
        } finally {
          // 5. Cleanup when the loop breaks or connection closes
          notifier.unsubscribe(channelId, listener);
          console.log(`Connection closed for channel: ${channelId}`);
        }
      },
      cancel() {
        // This is triggered if the client disconnects (browser closes tab, etc.)
        console.log(`Client disconnected from ${channelId}`);
      },
    });

    return new Response(stream);
  });
