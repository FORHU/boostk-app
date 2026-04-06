import { createFileRoute } from "@tanstack/react-router";
import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel } from "amqplib";
import z from "zod";
import { EventType, type Message } from "@/lib/notifier/core";
import { connection, EXCHANGE_NAME } from "@/lib/rabbitmq";

const SseSchema = z.object({
  userId: z.string().min(1).default("anonymous"),
  projectId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
  ticketId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
});

export const Route = createFileRoute("/api/notification/sse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const result = SseSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
        if (!result.success) {
          return Response.json({ success: false, error: result.error.message }, { status: 400 });
        }

        const { userId, projectId, ticketId } = result.data;

        const encoder = new TextEncoder();
        let sseChannelWrapper: ChannelWrapper;

        const stream = new ReadableStream({
          start(controller) {
            const sendSseMessage = (message: Message) => {
              const sseString = `id: ${message.id || ""}\nevent: ${message.event}\ndata: ${JSON.stringify(message.data)}\n\n`;
              controller.enqueue(encoder.encode(sseString));
            };

            // Initial connection message
            sendSseMessage({
              data: { status: "connected" },
              event: EventType.CONNECTED,
            });

            // Heartbeat to keep connection alive
            const timer = setInterval(() => {
              sendSseMessage({
                data: { heartbeat: Date.now() },
                event: EventType.HEARTBEAT,
              });
            }, 8000);

            // Create a rabbitmq channel for the user
            sseChannelWrapper = connection.createChannel({
              setup: async (channel: ConfirmChannel) => {
                const tempQueue = await channel.assertQueue("", {
                  exclusive: true,
                  autoDelete: true,
                });
                const sseQueue = tempQueue.queue;

                await channel.bindQueue(sseQueue, EXCHANGE_NAME, "test.queue");

                // Bind to project and ticket queues
                if (projectId) {
                  await channel.bindQueue(sseQueue, EXCHANGE_NAME, `project.${projectId}.*`);
                }
                if (ticketId) {
                  await channel.bindQueue(sseQueue, EXCHANGE_NAME, `ticket.${ticketId}.*`);
                }

                // Consume messages and push to SSE stream
                await channel.consume(sseQueue, (msg) => {
                  if (!msg) return;

                  try {
                    const payload = JSON.parse(msg.content.toString());
                    console.log("[SSE] Received message from rabbitmq:", payload);

                    sendSseMessage({
                      event: payload.event,
                      data: payload.data,
                      id: payload.id,
                    });

                    // Acknowledge the message only on success
                    channel.ack(msg);
                  } catch (error) {
                    console.error("[SSE] Failed to parse RabbitMQ message", error);
                    // Nack the message so it gets removed from the queue and doesn't block other messages.
                    channel.nack(msg);
                  }
                });
              },
            });

            sseChannelWrapper.on("error", (err) => {
              console.error(`[SSE] RabbitMQ Channel Error for User ${userId}:`, err);
              // TODO: Send an SSE event to the client telling them
              // the real-time connection degraded, so they know to refresh or rely on standard polling.
            });

            request.signal.addEventListener("abort", () => {
              console.log(`[SSE] Client ${userId} disconnected. Cleaning up...`);
              clearInterval(timer);

              if (sseChannelWrapper) {
                sseChannelWrapper.close().catch(console.error);
              }

              // TODO: Check if this is needed
              // controller.close();
            });
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
