import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { auth } from "@/lib/auth";
import { EventType, type Message } from "@/lib/notifier/core";
import { subscribeSseStream } from "@/lib/sse-hub";

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

            // Patterns this stream listens on, in the old RabbitMQ binding syntax.
            const patterns: string[] = [];
            // Agent dashboard notifications
            if (userId && userId !== "anonymous") patterns.push(`user.${userId}.*`);
            if (projectId) patterns.push(`project.${projectId}.*`);
            if (ticketId) patterns.push(`ticket.${ticketId}.*`);

            let closed = false;
            const close = () => {
              if (closed) return;
              closed = true;
              clearInterval(timer);
              unsubscribe();
              controller.close();
            };

            const unsubscribe = subscribeSseStream(
              patterns,
              (_routingKey, payload) => {
                const message = payload as Message;
                sendSseMessage({ event: message.event, data: message.data, id: message.id });
              },
              () => {
                sendSseMessage({ event: EventType.DEGRADED, data: { reason: "queue_error" } });
                close();
              },
            );

            request.signal.addEventListener("abort", () => {
              // [SSE] client disconnect log removed
              close();
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
