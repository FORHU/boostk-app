import { useEffect, useState } from "react";
import { EventType, type Message } from "@/lib/notifier/core";

export function useNotifications({ userId, ticketId }: { userId?: string; ticketId?: string }) {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    if (!userId && !ticketId) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (ticketId) params.append("ticketId", ticketId);

    const eventSource = new EventSource(`/api/notification/sse?${params.toString()}`);

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log(`[SSE] Received ${e.type} event:`, data);

        setLastMessage({ event: e.type as EventType, data: data });
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    // Specific System Handlers
    eventSource.addEventListener(EventType.CONNECTED, (e) => {
      setStatus("connected");
      handleMessage(e);
    });
    eventSource.addEventListener(EventType.HEARTBEAT, () => {
      console.log("[SSE] Heartbeat received");
    });

    // Business Logic Handlers
    // You MUST add listeners for specific event types if the server sends the "event:" field
    eventSource.addEventListener(EventType.TEST, handleMessage);
    eventSource.addEventListener(EventType.TICKET_CREATED, handleMessage);
    eventSource.addEventListener(EventType.CHAT_MESSAGE, handleMessage);
    eventSource.addEventListener(EventType.TICKET_STATUS_CHANGED, handleMessage);

    // This handles messages WITHOUT an "event:" line in the SSE stream
    // Should never happen if everything is configured correctly
    eventSource.onmessage = handleMessage;

    eventSource.onerror = (err) => {
      console.error("[SSE] Error:", err);
      setStatus("disconnected");
      eventSource.close();
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [userId, ticketId]);

  return { lastMessage, status };
}
