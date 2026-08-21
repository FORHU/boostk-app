import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { EventType, type Message } from "@/lib/notifier/core";
import {
  getUnreadTicketSummaries,
  markIntakeTicketReadFn,
  markTicketReadFn,
} from "@/modules/notification/notification.functions";
import { type ConnectionStatus, type NotificationItem, shouldRingBell, useNotifications } from "./use-notifications";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const MAX_NOTIFICATIONS = 20;

const NOTIFICATION_EVENTS = new Set<EventType>([EventType.TICKET_CREATED, EventType.CHAT_MESSAGE]);

function upsertNotification(
  prev: NotificationItem[],
  event: EventType,
  data: unknown,
  localIdRef: React.MutableRefObject<number>,
): NotificationItem[] {
  const ticketId = (data as Record<string, unknown> | null)?.ticketId;

  if (typeof ticketId === "string") {
    const existingIndex = prev.findIndex((n) => n.event === event && n.data?.ticketId === ticketId);
    if (existingIndex !== -1) {
      const updated = [...prev];
      updated[existingIndex] = {
        ...prev[existingIndex],
        data: {
          ...prev[existingIndex].data,
          content: (data as Record<string, unknown>)?.content ?? prev[existingIndex].data.content,
          sender: (data as Record<string, unknown>)?.sender ?? prev[existingIndex].data.sender,
          createdAt: (data as Record<string, unknown>)?.createdAt ?? prev[existingIndex].data.createdAt,
          unreadCount: ((prev[existingIndex].data?.unreadCount as number) ?? 0) + 1,
        },
        timestamp: Date.now(),
        read: false,
      };
      return updated;
    }
  }

  const signature = JSON.stringify(data);
  if (prev.some((n) => n.event === event && JSON.stringify(n.data) === signature)) {
    return prev;
  }

  localIdRef.current += 1;
  const item: NotificationItem = {
    localId: localIdRef.current,
    event,
    data,
    timestamp: Date.now(),
    read: false,
  };
  return [item, ...prev].slice(0, MAX_NOTIFICATIONS);
}

export function useSocket({ userId, ticketId, projectId }: { userId?: string; ticketId?: string; projectId?: string }) {
  const [useSseFallback, setUseSseFallback] = useState(false);
  const sse = useNotifications({ userId, ticketId, enabled: useSseFallback });

  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const localIdRef = useRef(0);
  const hasConnectedOnceRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    getUnreadTicketSummaries()
      .then((summaries) => {
        if (summaries.length === 0) return;
        setNotifications((prev) => {
          const existingTicketIds = new Set(
            prev.map((n) => n.data?.ticketId).filter((id): id is string => typeof id === "string"),
          );
          const newItems: NotificationItem[] = [];
          for (const s of summaries) {
            if (existingTicketIds.has(s.ticketId)) continue;
            localIdRef.current += 1;
            newItems.push({
              localId: localIdRef.current,
              event: EventType.CHAT_MESSAGE,
              data: {
                ticketId: s.ticketId,
                referenceNumber: s.referenceNumber,
                projectId: s.projectId,
                projectSlug: s.projectSlug,
                projectName: s.projectName,
                customerName: s.customerName,
                content: s.lastMessagePreview,
                sender: s.sender,
                createdAt: s.lastMessageAt,
                unreadCount: s.unreadCount,
                isIntake: s.isIntake,
              },
              timestamp: Date.now(),
              read: false,
            });
          }
          return [...newItems, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
      })
      .catch((err) => {
        console.error("[Socket] Failed to hydrate unread summaries:", err);
      });
  }, [userId]);

  useEffect(() => {
    if (useSseFallback) return;
    if (!userId && !ticketId) return;
    if (typeof window === "undefined") return;

    const handleEvent = (event: string, data: unknown) => {
      const message = { event: event as EventType, data };
      setLastMessage(message);

      // The relay lost its RabbitMQ channel. The socket itself is still open, so neither
      // `disconnect` nor `connect_error` will fire -- without this the indicator would
      // stay green while no event can ever arrive again. Not a notification, so it
      // returns before the bell logic.
      if (message.event === EventType.DEGRADED) {
        setStatus("reconnecting");
        return;
      }

      // Symmetric recovery signal: the relay re-established its RabbitMQ channel after
      // broadcasting DEGRADED. The socket never dropped, so without this the indicator
      // would sit on "reconnecting" forever.
      if (message.event === EventType.CONNECTED) {
        setStatus("connected");
        return;
      }

      const shouldRing = NOTIFICATION_EVENTS.has(message.event) && shouldRingBell(message.event, data, userId);

      if (shouldRing) {
        setNotifications((prev) => upsertNotification(prev, message.event, data, localIdRef));
      }
    };

    const socket: Socket = io(SOCKET_URL, {
      query: { userId, ticketId, projectId },
      transports: ["websocket", "polling"],
      // The relay authorizes room membership from the better-auth session and ticket
      // cookies at handshake; without this the browser strips cookies cross-origin and
      // every connection is rejected as unauthenticated.
      withCredentials: true,
    });

    socket.on("connect", () => {
      hasConnectedOnceRef.current = true;
      setStatus("connected");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] connect_error:", err.message);
      if (!hasConnectedOnceRef.current) {
        setUseSseFallback(true);
        return;
      }
      setStatus("reconnecting");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect") return;
      setStatus("reconnecting");
    });

    socket.onAny(handleEvent);

    return () => {
      socket.disconnect();
    };
  }, [useSseFallback, userId, ticketId, projectId]);

  const markAsRead = useCallback((ticketId: string, isIntake?: boolean) => {
    setNotifications((prev) =>
      prev.some((n) => n.data?.ticketId === ticketId && !n.read)
        ? prev.map((n) => (n.data?.ticketId === ticketId ? { ...n, read: true } : n))
        : prev,
    );

    const fn = isIntake ? markIntakeTicketReadFn : markTicketReadFn;
    fn({ data: { ticketId } }).catch((err) => console.error("[Socket] markAsRead failed:", err));
  }, []);

  if (useSseFallback) {
    return {
      lastMessage: sse.lastMessage,
      status: sse.status,
      notifications: sse.notifications,
      unreadCount: sse.unreadCount,
      markAsRead: sse.markAsRead,
    };
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { lastMessage, status, notifications, unreadCount, markAsRead };
}
