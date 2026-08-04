import { useCallback, useEffect, useRef, useState } from "react";
import { EventType, type Message } from "@/lib/notifier/core";

const HEARTBEAT_TIMEOUT_MS = 25000;
const RECONNECTING_MIN_HOLD_MS = 1500;

const MAX_NOTIFICATIONS = 20;

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

export type NotificationItem = {
  localId: number;
  event: EventType;
  // biome-ignore lint/suspicious/noExplicitAny: <data shape varies per event type>
  data: any;
  timestamp: number;
  read: boolean;
};

// Only these business events surface in the notification bell (new ticket / new message).
const NOTIFICATION_EVENTS = new Set<EventType>([EventType.TICKET_CREATED, EventType.CHAT_MESSAGE]);

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
      // Before the first successful connection, a failed attempt is just "connecting".
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
      // Hold the "reconnecting" state visible so an instant reconnect doesn't
      // turn the indicator into an invisible flash.
      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        reconnectingSince = null;
        setStatusSafely("connected");
      }, RECONNECTING_MIN_HOLD_MS - elapsed);
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log(`[SSE] Received ${e.type} event:`, data);

        const message = { event: e.type as EventType, data: data };
        setLastMessage(message);

        if (NOTIFICATION_EVENTS.has(message.event)) {
          const signature = JSON.stringify(message.data);
          setNotifications((prev) => {
            if (prev.some((n) => n.event === message.event && JSON.stringify(n.data) === signature)) {
              return prev;
            }
            localIdRef.current += 1;
            const item: NotificationItem = {
              localId: localIdRef.current,
              event: message.event,
              data: message.data,
              timestamp: Date.now(),
              read: false,
            };
            return [item, ...prev].slice(0, MAX_NOTIFICATIONS);
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

      // Specific System Handlers
      nextSource.addEventListener(EventType.CONNECTED, (e) => {
        lastActivityAt = Date.now();
        markConnected();
        handleMessage(e);
      });
      nextSource.addEventListener(EventType.HEARTBEAT, () => {
        lastActivityAt = Date.now();
        markConnected();
        console.log("[SSE] Heartbeat received");
      });

      // Business Logic Handlers
      // You MUST add listeners for specific event types if the server sends the "event:" field
      nextSource.addEventListener(EventType.TEST, handleMessage);
      nextSource.addEventListener(EventType.TICKET_CREATED, handleMessage);
      nextSource.addEventListener(EventType.CHAT_MESSAGE, handleMessage);
      nextSource.addEventListener(EventType.TICKET_STATUS_CHANGED, handleMessage);

      // This handles messages WITHOUT an "event:" line in the SSE stream
      // Should never happen if everything is configured correctly
      nextSource.onmessage = handleMessage;

      nextSource.onerror = (err) => {
        console.error("[SSE] Error:", err);
        // Do NOT close the connection: EventSource auto-reconnects, and the server
        // re-sends the "connected" event once the stream is re-established.
        markReconnecting();
      };
    };

    const markOffline = () => {
      // Being offline is always "reconnecting", even before the first successful connection.
      if (reconnectingSince === null) reconnectingSince = Date.now();
      setStatusSafely("reconnecting");
      if (eventSource) eventSource.close();
    };

    const handleOffline = () => {
      markOffline();
    };

    const handleOnline = () => {
      // Deterministic recovery: open a fresh stream instead of relying on the
      // browser's auto-reconnect, which can stall after a network restore.
      connect();
    };

    connect();
    if (!navigator.onLine) markOffline();
    // Watchdog: surface silent drops (where onerror may fire late or not at all)
    // by flagging "reconnecting" if no connected/heartbeat message has arrived recently.
    const watchdog = setInterval(() => {
      if (Date.now() - lastActivityAt > HEARTBEAT_TIMEOUT_MS) {
        markReconnecting();
      }
    }, 5000);

    // When the tab returns to the foreground, re-check liveness immediately
    // instead of waiting for the next watchdog tick.
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
      console.log("[SSE] Closing connection");
      if (eventSource) eventSource.close();
    };
  }, [userId, ticketId, enabled]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => (prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { lastMessage, status, notifications, unreadCount, markAllRead };
}
