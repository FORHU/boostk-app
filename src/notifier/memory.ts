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

  onBroadcast<T>(topicId: string, data: T, event: EventType): void {
    console.log(`[Notifier] Broadcast to ${topicId} with event ${event}`);
    const message: Message<T> = {
      id: crypto.randomUUID(),
      event,
      data,
    };

    this.deliverToSubscribers(topicId, message);
  }

  private deliverToSubscribers(channelId: string, message: Message) {
    this.addToBuffer(channelId, message);

    const channelSubscribers = this.subscribers.get(channelId);
    if (channelSubscribers) {
      for (const callback of channelSubscribers) {
        callback(message);
      }
    }
  }

  private addToBuffer(channelId: string, message: Message) {
    const buffer = this.buffers.get(channelId) || [];
    buffer.push(message);

    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }
    this.buffers.set(channelId, buffer);
  }

  subscribe(channelId: string, callback: MessageCallback, lastEventId?: string): void {
    let callbacks = this.subscribers.get(channelId);

    if (!callbacks) {
      callbacks = new Set();
      this.subscribers.set(channelId, callbacks);
    }

    callbacks.add(callback);

    if (lastEventId) {
      const buffer = this.buffers.get(channelId) || [];
      const idx = buffer.findIndex((m) => m.id === lastEventId);

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

    if (agentSubs.has(topicId)) return;

    const callback: MessageCallback = (message: Message) => {
      console.log(`[Notifier] Fanning out ${message.event} from ${topicId} -> ${agentId}`);
      this.onBroadcast(agentId, message.data, message.event);
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

    for (const [topicId, callback] of agentSubs.entries()) {
      this.unsubscribe(topicId, callback);
    }

    this.agentTopicCallbacks.delete(agentId);
    console.log(`[Notifier] Cleaned up all topic routes for agent: ${agentId}`);
  }

  getState() {
    console.log(`[Notifier] State requested`);
    return {
      subscribers: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([channel, subs]) => [channel, { count: subs.size }]),
      ),
      buffers: Object.fromEntries(this.buffers),
      bufferSize: this.bufferSize,
      agentRouting: Object.fromEntries(
        Array.from(this.agentTopicCallbacks.entries()).map(([agentId, topics]) => [agentId, Array.from(topics.keys())]),
      ),
    };
  }
}
