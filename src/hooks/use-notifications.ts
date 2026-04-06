import { useEffect, useState } from "react";
import { EventType, type Message } from "@/lib/notifier/core";

export function useNotifications(userId: string) {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const eventSource = new EventSource(`/api/notification/sse?userId=${userId}`);

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
  }, [userId]);

  return { lastMessage, status };
}
