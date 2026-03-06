import { createFileRoute } from "@tanstack/react-router";
import { getNotifier } from "@/notifier/impl";

export const Route = createFileRoute("/api/sse")({
  GET: ({ request }) => {
    const url = new URL(request.url);
    const channelId = url.searchParams.get("channelId");

    if (!channelId) {
      return new Response("Missing channelId", { status: 400 });
    }

    const lastEventId = url.searchParams.get("lastEventId") || request.headers.get("last-event-id") || undefined;
    const notifier = getNotifier();

    // Variables held in closure so cancel() can access them
    let heartbeatInterval: ReturnType<typeof setInterval>;
    let streamListener: (data: any) => void;

    const stream = new ReadableStream({
      start(controller) {
        console.log(`[SSE API] Stream established for ${channelId} (LastEventId: ${lastEventId || "none"})`);

        // Send initial connection message.
        controller.enqueue(
          `data: ${JSON.stringify({ event: "system", data: "connected", timestamp: Date.now() })}\n\n`,
        );

        // 1. Define a direct listener
        streamListener = (message: any) => {
          try {
            const payload = JSON.stringify(message);
            controller.enqueue(`id: ${message.id}\ndata: ${payload}\n\n`);
          } catch (err) {
            console.error(`[SSE API] Failed to enqueue message for ${channelId}`, err);
          }
        };

        // 2. Setup standard heartbeat
        heartbeatInterval = setInterval(() => {
          try {
            const payload = JSON.stringify({ event: "heartbeat", timestamp: Date.now() });
            controller.enqueue(`data: ${payload}\n\n`);
          } catch (e) {
            clearInterval(heartbeatInterval);
          }
        }, 5000);

        // 3. Subscribe
        notifier.subscribe(channelId, streamListener, lastEventId);
      },
      cancel() {
        console.log(`[SSE API] Client disconnected from ${channelId}`);
        clearInterval(heartbeatInterval);
        notifier.unsubscribe(channelId, streamListener);
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
});
