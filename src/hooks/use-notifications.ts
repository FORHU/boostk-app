import { useCallback, useEffect, useRef, useState } from "react";
import { EventType, type Message } from "@/lib/notifier/core";
import {
  getUnreadTicketSummaries,
  markTicketReadFn,
  type UnreadTicketSummary,
} from "@/modules/notification/notification.functions";

const HEARTBEAT_TIMEOUT_MS = 25000;
const RECONNECTING_MIN_HOLD_MS = 1500;

const MAX_NOTIFICATIONS = 20;

export type { UnreadTicketSummary };

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

export type NotificationItem = {
  localId: number;
  event: EventType;
  // biome-ignore lint/suspicious/noExplicitAny: <data shape varies per event type>
  data: any;
  timestamp: number;
  read: boolean;
};

const NOTIFICATION_EVENTS = new Set<EventType>([EventType.TICKET_CREATED, EventType.CHAT_MESSAGE]);

export function shouldRingBell(event: EventType, data: unknown, userId?: string): boolean {
  if (event !== EventType.CHAT_MESSAGE) return true;
  if (!userId) return true;
  const notifyUserId = (data as { notifyUserId?: unknown } | null)?.notifyUserId;
  if (typeof notifyUserId !== "string") return true;
  return notifyUserId === userId;
}

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

export function useNotifications({
  userId,
  ticketId,
  enabled = true,
}: {
  userId?: string;
  ticketId?: string;
  enabled?: boolean;
}) {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const localIdRef = useRef(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
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
                projectName: s.projectName,
                customerName: s.customerName,
                content: s.lastMessagePreview,
                sender: s.sender,
                createdAt: s.lastMessageAt,
                unreadCount: s.unreadCount,
              },
              timestamp: Date.now(),
              read: false,
            });
          }
          return [...newItems, ...prev].slice(0, MAX_NOTIFICATIONS);
        });
      })
      .catch((err) => {
        console.error("[Notifications] Failed to hydrate unread summaries:", err);
      });
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) return;
    if (!userId && !ticketId) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (ticketId) params.append("ticketId", ticketId);

    const url = `/api/notification/sse?${params.toString()}`;

    let isMounted = true;
    let hasConnectedOnce = false;
    let lastActivityAt = Date.now();
    let reconnectingSince: number | null = null;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    const setStatusSafely = (next: ConnectionStatus) => {
      if (isMounted) setStatus(next);
    };

    const markReconnecting = () => {
      if (!hasConnectedOnce) {
        setStatusSafely("connecting");
        return;
      }
      if (reconnectingSince === null) reconnectingSince = Date.now();
      setStatusSafely("reconnecting");
    };

    const markConnected = () => {
      hasConnectedOnce = true;
      const elapsed = reconnectingSince === null ? Number.POSITIVE_INFINITY : Date.now() - reconnectingSince;
      if (elapsed >= RECONNECTING_MIN_HOLD_MS) {
        reconnectingSince = null;
        setStatusSafely("connected");
        return;
      }
      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        reconnectingSince = null;
        setStatusSafely("connected");
      }, RECONNECTING_MIN_HOLD_MS - elapsed);
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        // [SSE] debug log removed

        const message = { event: e.type as EventType, data: data };
        setLastMessage(message);

        const shouldRing =
          NOTIFICATION_EVENTS.has(message.event) && shouldRingBell(message.event, message.data, userId);
        // [SSE] debug log removed

        if (shouldRing) {
          setNotifications((prev) => {
            const next = upsertNotification(prev, message.event, message.data, localIdRef);
            // [SSE] debug log removed
            return next;
          });
        }
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    const connect = () => {
      if (eventSource) eventSource.close();

      const nextSource = new EventSource(url);
      eventSource = nextSource;

      nextSource.addEventListener(EventType.CONNECTED, (e) => {
        lastActivityAt = Date.now();
        markConnected();
        handleMessage(e);
      });
      nextSource.addEventListener(EventType.HEARTBEAT, () => {
        lastActivityAt = Date.now();
        markConnected();
        // [SSE] heartbeat log removed
      });

      nextSource.addEventListener(EventType.TEST, handleMessage);
      nextSource.addEventListener(EventType.TICKET_CREATED, handleMessage);
      nextSource.addEventListener(EventType.CHAT_MESSAGE, handleMessage);
      nextSource.addEventListener(EventType.TICKET_STATUS_CHANGED, handleMessage);

      nextSource.onmessage = handleMessage;

      nextSource.onerror = (err) => {
        console.error("[SSE] Error:", err);
        markReconnecting();
      };
    };

    const markOffline = () => {
      if (reconnectingSince === null) reconnectingSince = Date.now();
      setStatusSafely("reconnecting");
      if (eventSource) eventSource.close();
    };

    const handleOffline = () => {
      markOffline();
    };

    const handleOnline = () => {
      connect();
    };

    connect();
    if (!navigator.onLine) markOffline();
    const watchdog = setInterval(() => {
      if (Date.now() - lastActivityAt > HEARTBEAT_TIMEOUT_MS) {
        markReconnecting();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastActivityAt > HEARTBEAT_TIMEOUT_MS) {
        markReconnecting();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      clearInterval(watchdog);
      if (transitionTimer) clearTimeout(transitionTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      // [SSE] closing connection log removed
      if (eventSource) eventSource.close();
    };
  }, [userId, ticketId, enabled]);

  const markAsRead = useCallback((ticketId: string) => {
    setNotifications((prev) =>
      prev.some((n) => n.data?.ticketId === ticketId && !n.read)
        ? prev.map((n) => (n.data?.ticketId === ticketId ? { ...n, read: true } : n))
        : prev,
    );

    markTicketReadFn({ data: { ticketId } }).catch((err) =>
      console.error("[Notifications] markTicketReadFn failed:", err),
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { lastMessage, status, notifications, unreadCount, markAsRead };
}
