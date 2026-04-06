import { createFileRoute } from "@tanstack/react-router";
import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel } from "amqplib";
import z from "zod";
import { EventType, type Message } from "@/lib/notifier/core";
import { connection, EXCHANGE_NAME } from "@/lib/rabbitmq";

const CustomerSseSchema = z.object({
  ticketId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
  customerId: z.string().min(1).default("anonymous"),
});

export const Route = createFileRoute("/api/notification/customer/sse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const result = CustomerSseSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
        if (!result.success) return Response.json({ error: "Invalid parameters" }, { status: 400 });

        const { ticketId, customerId } = result.data;

        if (ticketId) {
          const ticketBelongsToCustomer = true;

          if (!ticketBelongsToCustomer) {
            return new Response("Forbidden: You do not own this ticket", { status: 403 });
          }
        }

        const encoder = new TextEncoder();
        let sseChannelWrapper: ChannelWrapper;

        const stream = new ReadableStream({
          start(controller) {
            const sendSseMessage = (message: Message) => {
              const sseString = `id: ${message.id || ``}\nevent: ${message.event}\ndata: ${JSON.stringify(message.data)}\n\n`;
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

            sseChannelWrapper = connection.createChannel({
              setup: async (channel: ConfirmChannel) => {
                const tempQueue = await channel.assertQueue("", { exclusive: true, autoDelete: true });
                const sseQueue = tempQueue.queue;

                // 3. Bind to the Customer's global events (e.g., "New notification")
                await channel.bindQueue(sseQueue, EXCHANGE_NAME, `customer.${customerId}.*`);

                // 4. Bind to the specific ticket ONLY because we verified ownership above
                if (ticketId) {
                  await channel.bindQueue(sseQueue, EXCHANGE_NAME, `ticket.${ticketId}.*`);
                }

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

                    channel.ack(msg);
                  } catch (error) {
                    console.error("[SSE] Failed to parse RabbitMQ message", error);
                    channel.nack(msg, false, false)
                  }
                });
              },
            });

            sseChannelWrapper.on("error", (err) => {
              console.error(`[SSE] RabbitMQ Channel Error for Customer ${customerId}:`, err);
              // TODO: Send an SSE event to the client telling them
              // the real-time connection degraded, so they know to refresh or rely on standard polling.
            });

            request.signal.addEventListener("abort", () => {
              console.log(`[SSE] Client ${customerId} disconnected. Cleaning up...`);
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
