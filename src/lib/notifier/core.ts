export enum EventType {
  CONNECTED = "connected",
  HEARTBEAT = "heartbeat",

  BROADCAST = "broadcast",
  JOIN = "join",

  TICKET_CREATED = "ticket_created",
  TICKET_ASSIGNED = "ticket_assigned",
  TICKET_STATUS_CHANGED = "ticket_status_changed",
  CHAT_MESSAGE = "chat_message",

  TEST = "test",
}

// biome-ignore lint/suspicious/noExplicitAny: <TODO: fix any type here later>
export type Message<T = any> = {
  id?: string;
  data: T;
  event: EventType;
};
