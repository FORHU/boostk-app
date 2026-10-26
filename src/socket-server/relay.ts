import type { Server } from "socket.io";
import { env } from "@/env";
import { type EventSubscription, subscribeToEvents } from "@/lib/messaging";
import { EventType } from "@/lib/notifier/core";

const RELAYED_SCOPES = new Set(["user", "ticket", "project"]);

/**
 * Relays events from the BoostK topic to connected socket.io clients. The relay drains
 * its own SQS queue (RELAY_QUEUE_URL, subscribed to the topic); each message's routing
 * key (`<scope>.<id>.<event>`) is mapped to a room (`<scope>:<id>`) where the event is
 * re-emitted to its members.
 */
export function startRealtimeRelay(io: Server): EventSubscription {
  return subscribeToEvents(
    env.RELAY_QUEUE_URL,
    (routingKey, payload) => {
      const [scope, id, ...rest] = routingKey.split(".");
      if (!scope || !RELAYED_SCOPES.has(scope)) return;

      const routingEvent = rest.join(".");
      const message = payload as { event?: unknown; data?: unknown } | null;
      // Prefer the explicit `event` on the payload (matches SSE semantics);
      // fall back to the last routing-key segment.
      const event = message && typeof message.event === "string" ? message.event : routingEvent;

      if (id && event) {
        io.to(`${scope}:${id}`).emit(event, message?.data);
      }
    },
    {
      // Tell every connected client the feed is broken, the way the SSE route already does.
      // This failure is invisible otherwise: the socket itself stays open, so `disconnect`
      // and `connect_error` never fire and the client keeps showing "connected" while no
      // event will ever arrive again. Broadcast rather than per-room — the relay is a single
      // shared consumer, so when it fails it fails for everyone.
      onDegraded: () => io.emit(EventType.DEGRADED, { reason: "relay_queue_error" }),
      // The poller retries on its own, so unlike the old channel error this heals. Say so,
      // or clients stay on "reconnecting" until their socket happens to reconnect.
      onRecovered: () => io.emit(EventType.CONNECTED, { status: "connected" }),
    },
  );
}
