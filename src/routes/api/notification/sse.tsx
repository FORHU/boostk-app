import { createFileRoute } from "@tanstack/react-router";
import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel } from "amqplib";
import z from "zod";
import { auth } from "@/lib/auth";
import { EventType, type Message } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { connection, EXCHANGE_NAME } from "@/lib/rabbitmq";
import { TICKET_COOKIE_NAME } from "@/modules/ticket/ticket.constants";

// Every binding on this stream is a live feed of someone's support conversations, so
// each requested scope is verified against a real credential before its queue binding
// is created:
//
// - `userId` must equal the caller's better-auth session user id. Agents listen to their
//   own `user.<id>.*` notification feed and nothing else.
// - `ticketId` must match the ticket referenced by the customer widget's ticket cookie
//   (the same bearer credential that authorizes messaging on the conversation).
//
// An anonymous or unauthenticated request gets no bindings at all — there is no
// "anonymous" default stream to subscribe to.
const SseSchema = z.object({
  userId: z.string().min(1).optional(),
  ticketId: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/)
    .optional(),
});

/** Minimal RFC 6265 cookie reader — avoids importing server-only cookie helpers into an API route. */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export const Route = createFileRoute("/api/notification/sse")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const result = SseSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
        if (!result.success) {
          return Response.json({ success: false, error: result.error.message }, { status: 400 });
        }

        const { userId, ticketId } = result.data;

        // At least one scope is required; a connection with nothing bound could never
        // receive an event and would only hold a RabbitMQ consumer open.
        if (!userId && !ticketId) {
          return Response.json({ success: false, error: "userId or ticketId is required" }, { status: 401 });
        }

        let sessionUserId: string | null = null;
        try {
          const session = await auth.api.getSession({ headers: new Headers(request.headers) });
          sessionUserId = session?.user.id ?? null;
        } catch (error) {
          console.error("[SSE] Session lookup failed:", error);
          return Response.json({ success: false, error: "Authentication unavailable" }, { status: 503 });
        }

        // A session may only subscribe to its own user feed.
        if (userId && userId !== sessionUserId) {
          return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // A visitor may only subscribe to the conversation their ticket cookie points at.
        if (ticketId) {
          const referenceNumber = readCookie(request.headers.get("cookie"), TICKET_COOKIE_NAME);
          const ticket = referenceNumber
            ? await prisma.ticket.findFirst({
                where: { id: ticketId, referenceNumber },
                select: { id: true },
              })
            : null;
          if (!ticket) {
            return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
          }
        }

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

                // Bind only the scopes that were just verified against credentials.
                if (sessionUserId) {
                  await channel.bindQueue(sseQueue, EXCHANGE_NAME, `user.${sessionUserId}.*`);
                }
                if (ticketId) {
                  await channel.bindQueue(sseQueue, EXCHANGE_NAME, `ticket.${ticketId}.*`);
                }

                // Consume messages and push to SSE stream
                await channel.consume(sseQueue, (msg) => {
                  if (!msg) return;

                  try {
                    const payload = JSON.parse(msg.content.toString());

                    sendSseMessage({
                      event: payload.event,
                      data: payload.data,
                      id: payload.id,
                    });

                    // Acknowledge the message only on success
                    channel.ack(msg);
                  } catch (error) {
                    console.error("[SSE] Failed to parse RabbitMQ message", error);
                    // A malformed payload is unparseable on every redelivery, so drop it
                    // (requeue=false). The default nack requeues, which turns one bad
                    // message into an infinite hot loop.
                    channel.nack(msg, false, false);
                  }
                });
              },
            });

            sseChannelWrapper.on("error", (err) => {
              console.error(`[SSE] RabbitMQ Channel Error for User ${userId}:`, err);
              sendSseMessage({
                event: EventType.DEGRADED,
                data: { reason: "channel_error" },
              });
              clearInterval(timer);
              controller.close();
              // amqp-connection-manager auto-recovers channels; without closing the
              // wrapper it re-runs `setup` and resurrects a consumer feeding a dead
              // stream, whose enqueue throws land right back in the nack path.
              sseChannelWrapper.close().catch(console.error);
            });

            request.signal.addEventListener("abort", () => {
              clearInterval(timer);
              controller.close();

              if (sseChannelWrapper) {
                sseChannelWrapper.close().catch(console.error);
              }
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
