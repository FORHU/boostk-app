export enum EventType {
  BROADCAST = "broadcast",
  JOIN = "join",
  TEST = "test",
  HEARTBEAT = "heartbeat",
}

// biome-ignore lint/suspicious/noExplicitAny: <TODO: fix any type here later>
export type Message<T = any> = {
  id: string;
  data: T;
  event: EventType;
};

export type MessageCallback = (message: Message) => unknown;

export interface Notifier {
  subscribe(channelId: string, callback: MessageCallback, lastEventId?: string): void;
  unsubscribe(channelId: string, callback: MessageCallback): void;

  onBroadcast<T>(channelId: string, data: T, event: EventType): void;

  // Links a user to a specific context (e.g., a ticket or project).
  // This ensures updates are sent to the correct people watching that ID.
  subscribeUserToTopic(userId: string, topicId: string): void;
  unsubscribeUserFromTopic(userId: string, topicId: string): void;

  getState(): void;
}
