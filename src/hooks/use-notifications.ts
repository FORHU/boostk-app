import { useEffect, useState } from "react";
import { EventType, type Message } from "@/lib/notifier/core";

interface NotificationConfig {
  role: "user" | "customer";
  userId?: string;
  projectId?: string;
  ticketId?: string;
}

export function useNotifications(config: NotificationConfig) {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamically build the correct URL based on the role
    const baseUrl = config.role === "user" ? "/api/notification/sse" : "/api/notification/customer/sse";
    const url = new URL(baseUrl, window.location.origin);

    if (config.userId) url.searchParams.append("userId", config.userId);
    if (config.projectId) url.searchParams.append("projectId", config.projectId);
    if (config.ticketId) url.searchParams.append("ticketId", config.ticketId);

    const eventSource = new EventSource(url.toString());

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log(`[SSE] Received ${e.type} event:`, data);

        setLastMessage({ event: e.type as EventType, data: data });
      } catch (err) {
        console.error("[SSE] Error parsing SSE data", err);
      }
    };

    // Specific System Handlers
    eventSource.addEventListener(EventType.CONNECTED, (e) => {
      setStatus("connected");
      handleMessage(e);
    });
    eventSource.addEventListener(EventType.HEARTBEAT, () => {
      // console.log("[SSE] Heartbeat received"); // commented out to reduce console spam
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
  }, [config.role, config.userId, config.projectId, config.ticketId]); 

  return { lastMessage, status };
}
