import type { EventType, Message, MessageCallback, Notifier } from "./core";

export class InMemoryNotifier implements Notifier {
  private subscribers: Map<string, Set<MessageCallback>>;
  private buffers: Map<string, Message[]>;
  private bufferSize: number;
  private agentTopicCallbacks: Map<string, Map<string, MessageCallback>>;

  constructor(bufferSize = 100) {
    this.subscribers = new Map();
    this.buffers = new Map();
    this.bufferSize = bufferSize;
    this.agentTopicCallbacks = new Map();
  }

  onBroadcast<T>(channelId: string, data: T, event: EventType): void {
    console.log(`[Notifier] Broadcast to ${channelId} with event ${event}`);
    const message: Message<T> = {
      // Use crypto for better collision resistance and cleaner code
      id: crypto.randomUUID(),
      event,
      data,
    };

    // 1. Manage Buffer (FIFO)
    let buffer = this.buffers.get(channelId);
    if (!buffer) {
      buffer = [];
      this.buffers.set(channelId, buffer);
    }
    buffer.push(message);
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }

    // 2. Notify Subscribers
    const callbacks = this.subscribers.get(channelId);
    if (!callbacks) return;

    // Convert Set to Array to prevent issues if a callback unsubscribes during the loop
    Array.from(callbacks).forEach((callback) => {
      try {
        callback(message);
      } catch (err) {
        console.error(`[Notifier] Callback error on ${channelId}:`, err);
      }
    });
  }

  subscribe(channelId: string, callback: MessageCallback, lastEventId?: string): void {
    let callbacks = this.subscribers.get(channelId);

    if (!callbacks) {
      callbacks = new Set(); // Using Set automatically handles "already subscribed" logic
      this.subscribers.set(channelId, callbacks);
    }

    callbacks.add(callback);

    // 3. Replay Logic
    if (lastEventId) {
      const buffer = this.buffers.get(channelId) || [];
      const idx = buffer.findIndex((m) => m.id === lastEventId);

      // If found, send everything AFTER that ID. If not found/expired, send the whole buffer.
      const missed = idx !== -1 ? buffer.slice(idx + 1) : buffer;
      missed.forEach((m) => {
        callback(m);
      });
    }
    console.log(`[Notifier] Subscribed to ${channelId}`);
  }

  unsubscribe(channelId: string, callback: MessageCallback): void {
    const callbacks = this.subscribers.get(channelId);
    if (callbacks) {
      callbacks.delete(callback);
      // Clean up the map entry if no one is listening anymore
      if (callbacks.size === 0) {
        this.subscribers.delete(channelId);
      }
    }
    console.log(`[Notifier] Unsubscribed from ${channelId}`);
  }

  subscribeUserToTopic(agentId: string, topicId: string): void {
    let agentSubs = this.agentTopicCallbacks.get(agentId);
    if (!agentSubs) {
      agentSubs = new Map();
      this.agentTopicCallbacks.set(agentId, agentSubs);
    }

    // Prevent duplicate routing logic for the same topic
    if (agentSubs.has(topicId)) return;

    const callback: MessageCallback = (message: Message) => {
      this.onBroadcast(`agent_${agentId}`, message.data, message.event);
    };

    this.subscribe(topicId, callback);
    agentSubs.set(topicId, callback);
    console.log(`[Notifier] Subscribed agent ${agentId} to topic ${topicId}`);
  }
  unsubscribeUserFromTopic(agentId: string, topicId: string): void {
    const agentSubs = this.agentTopicCallbacks.get(agentId);
    if (!agentSubs) return;

    const callback = agentSubs.get(topicId);
    if (callback) {
      this.unsubscribe(topicId, callback);
      agentSubs.delete(topicId);
    }
    console.log(`[Notifier] Unsubscribed agent ${agentId} from topic ${topicId}`);
  }

  cleanupAgent(agentId: string): void {
    const agentSubs = this.agentTopicCallbacks.get(agentId);
    if (!agentSubs) return;

    // Unsubscribe the "bridge" callbacks from all topics
    for (const [topicId, callback] of agentSubs.entries()) {
      this.unsubscribe(topicId, callback);
    }

    // Remove the agent from the routing map
    this.agentTopicCallbacks.delete(agentId);
    console.log(`[Notifier] Cleaned up all topic routes for agent: ${agentId}`);
  }

  getState() {
    console.log(`[Notifier] State requested`);
    return {
      subscribers: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([channel, subs]) => [
          channel,
          { count: subs.size }, // number of subscribers for each channel
        ]),
      ),
      buffers: Object.fromEntries(this.buffers),
      bufferSize: this.bufferSize,
      agentRouting: Object.fromEntries(
        Array.from(this.agentTopicCallbacks.entries()).map(([agentId, topics]) => [
          agentId,
          Array.from(topics.keys()), // Show which topics this agent is watching
        ]),
      ),
    };
  }
}
