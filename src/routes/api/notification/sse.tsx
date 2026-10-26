import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { EventType, type Message } from "@/lib/notifier/core";
import { subscribeSseStream } from "@/lib/sse-hub";

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
