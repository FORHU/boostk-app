import { type MessageCallback, MessageType, type Notifier } from "./core";

export class InMemoryNotifier implements Notifier {
  subscribers: Map<string, MessageCallback[]>;

  constructor() {
    this.subscribers = new Map();
  }

  onBroadcast(channelId: string, message: string): void {
    const callbacks = this.subscribers.get(channelId);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      callback({
        type: MessageType.BROADCAST,
        message,
      });
    });
  }

  onJoin(channelId: string): void {
    const callbacks = this.subscribers.get(channelId);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      callback({
        type: MessageType.JOIN,
      });
    });
  }

  subscribe(channelId: string, callback: MessageCallback): void {
    let callbacks = this.subscribers.get(channelId);

    if (!callbacks) {
      callbacks = [];
      this.subscribers.set(channelId, callbacks);
    }

    callbacks.push(callback);
  }

  unsubscribe(channelId: string, callback: MessageCallback): void {
    const callbacks = this.subscribers.get(channelId);

    // If callbacks is undefined, the check fails and we return safely
    if (!callbacks) return;

    const idx = callbacks.indexOf(callback);
    if (idx !== -1) {
      callbacks.splice(idx, 1);
    }
  }
}
