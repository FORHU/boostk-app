// The app server's single consumer of its realtime queue, shared by every SSE stream.
//
// RabbitMQ gave each SSE connection its own temporary queue. SQS queues are too slow and
// costly to create per connection, so the process drains SSE_QUEUE_URL once and the
// router fans each event out to the streams whose patterns match.

import { env } from "@/env";
import { EventRouter, type RoutedEventListener } from "./event-router";
import { type EventSubscription, subscribeToEvents } from "./messaging";

interface SseHub {
  router: EventRouter;
  degradedListeners: Set<() => void>;
  subscription: EventSubscription;
}

// Kept on globalThis so a dev-server module reload reuses the running poller. A second
// poller on the same queue would take half the events for a router nobody listens to.
const globalForHub = globalThis as typeof globalThis & { __boostkSseHub?: SseHub };

function createHub(): SseHub {
  const router = new EventRouter();
  const degradedListeners = new Set<() => void>();

  const subscription = subscribeToEvents(
    env.SSE_QUEUE_URL,
    (routingKey, payload) => router.dispatch(routingKey, payload),
    {
      onDegraded: () => {
        for (const listener of degradedListeners) listener();
      },
    },
  );

  return { router, degradedListeners, subscription };
}

/** Starts the shared poller if it is not running yet. Safe to call repeatedly. */
export function startSseHub(): SseHub {
  globalForHub.__boostkSseHub ??= createHub();
  return globalForHub.__boostkSseHub;
}

/**
 * Subscribes one SSE stream. `onDegraded` fires whenever the queue cannot be read, so
 * the stream can tell its client and close instead of looking healthy while silent.
 * Returns the unsubscribe; call it when the stream closes.
 */
export function subscribeSseStream(
  patterns: string[],
  onEvent: RoutedEventListener,
  onDegraded: () => void,
): () => void {
  const hub = startSseHub();
  const unsubscribe = hub.router.subscribe(patterns, onEvent);
  hub.degradedListeners.add(onDegraded);

  return () => {
    unsubscribe();
    hub.degradedListeners.delete(onDegraded);
  };
}
