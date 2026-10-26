// In-process fan-out for realtime events, replacing the per-connection RabbitMQ queues.
//
// Each process drains ONE SQS queue (see `lib/messaging.ts`) and hands every event to
// this router, which delivers it to the listeners whose patterns match. Patterns use the
// same syntax as the old RabbitMQ topic bindings, so `user.<id>.*` still means "any event
// for this user": `*` matches exactly one dot-separated word, `#` matches zero or more.

/** True when `routingKey` matches the topic `pattern`, with RabbitMQ topic semantics. */
export function matchesRoutingKey(pattern: string, routingKey: string): boolean {
  const patternWords = pattern.split(".");
  const keyWords = routingKey.split(".");

  const match = (p: number, k: number): boolean => {
    if (p === patternWords.length) return k === keyWords.length;
    const word = patternWords[p];
    if (word === "#") {
      // Try `#` consuming zero words, then one more, and so on.
      for (let skip = k; skip <= keyWords.length; skip++) {
        if (match(p + 1, skip)) return true;
      }
      return false;
    }
    if (k === keyWords.length) return false;
    return (word === "*" || word === keyWords[k]) && match(p + 1, k + 1);
  };

  return match(0, 0);
}

export type RoutedEventListener = (routingKey: string, payload: unknown) => void;

export class EventRouter {
  private readonly listeners = new Map<RoutedEventListener, string[]>();

  /** Registers `listener` for events matching any of `patterns`. Returns the unsubscribe. */
  subscribe(patterns: string[], listener: RoutedEventListener): () => void {
    this.listeners.set(listener, patterns);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(routingKey: string, payload: unknown): void {
    for (const [listener, patterns] of this.listeners) {
      if (!patterns.some((pattern) => matchesRoutingKey(pattern, routingKey))) continue;
      try {
        listener(routingKey, payload);
      } catch (err) {
        // One broken listener (e.g. a stream that just closed) must not starve the rest.
        console.error(`[event-router] Listener failed on ${routingKey}:`, err);
      }
    }
  }

  get size(): number {
    return this.listeners.size;
  }
}
