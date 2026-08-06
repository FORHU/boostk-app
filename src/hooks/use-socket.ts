import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { EventType, type Message } from "@/lib/notifier/core";
import { type ConnectionStatus, type NotificationItem, shouldRingBell, useNotifications } from "./use-notifications";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const MAX_NOTIFICATIONS = 20;

// Only these business events surface in the notification bell (new ticket / new message).
const NOTIFICATION_EVENTS = new Set<EventType>([EventType.TICKET_CREATED, EventType.CHAT_MESSAGE]);

/**
 * Socket.io-backed realtime hook with an SSE fallback.
 *
 * Opens a socket.io connection to the standalone relay server (scoped by
 * userId / projectId / ticketId). If the socket server is unreachable on the
 * very first connect, it permanently falls back to the EventSource-based
 * `useNotifications` hook so realtime degrades gracefully.
 */
export function useSocket({ userId, ticketId, projectId }: { userId?: string; ticketId?: string; projectId?: string }) {
  const [useSseFallback, setUseSseFallback] = useState(false);
  const sse = useNotifications({ userId, ticketId, enabled: useSseFallback });

  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const localIdRef = useRef(0);
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    if (useSseFallback) return;
    if (!userId && !ticketId) return;
    if (typeof window === "undefined") return;

    const handleEvent = (event: string, data: unknown) => {
      const message = { event: event as EventType, data };
      setLastMessage(message);

      if (NOTIFICATION_EVENTS.has(message.event) && shouldRingBell(message.event, data, userId)) {
        const signature = JSON.stringify(data);
        setNotifications((prev) => {
          if (prev.some((n) => n.event === message.event && JSON.stringify(n.data) === signature)) {
            return prev;
          }
          localIdRef.current += 1;
          const item: NotificationItem = {
            localId: localIdRef.current,
            event: message.event,
            data,
            timestamp: Date.now(),
            read: false,
          };
          return [item, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
      }
    };

    const socket: Socket = io(SOCKET_URL, {
      query: { userId, ticketId, projectId },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      hasConnectedOnceRef.current = true;
      setStatus("connected");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] connect_error:", err.message);
      if (!hasConnectedOnceRef.current) {
        // The socket server is unreachable — degrade to the SSE stream.
        setUseSseFallback(true);
        return;
      }
      setStatus("reconnecting");
    });

    socket.on("disconnect", (reason) => {
      // "io client disconnect" is triggered by our own cleanup in the effect teardown.
      if (reason === "io client disconnect") return;
      setStatus("reconnecting");
    });

    socket.onAny(handleEvent);

    return () => {
      socket.disconnect();
    };
  }, [useSseFallback, userId, ticketId, projectId]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => (prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev));
  }, []);

  if (useSseFallback) {
    return {
      lastMessage: sse.lastMessage,
      status: sse.status,
      notifications: sse.notifications,
      unreadCount: sse.unreadCount,
      markAllRead: sse.markAllRead,
    };
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { lastMessage, status, notifications, unreadCount, markAllRead };
}
