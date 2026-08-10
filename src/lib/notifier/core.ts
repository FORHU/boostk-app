export enum EventType {
  CONNECTED = "connected",
  HEARTBEAT = "heartbeat",

  BROADCAST = "broadcast",
  JOIN = "join",

  TICKET_CREATED = "ticket_created",
  TICKET_ASSIGNED = "ticket_assigned",
  TICKET_STATUS_CHANGED = "ticket_status_changed",
  CHAT_MESSAGE = "chat_message",
  // A global-intake chat was routed to an organization's project. Sent on the OLD
  // (intake) ticket channel — it is the last thing that channel ever carries — so the
  // visitor's open window can re-point itself at the new ticket and its socket room.
  TICKET_ROUTED = "ticket_routed",

  TEST = "test",
}

// biome-ignore lint/suspicious/noExplicitAny: <TODO: fix any type here later>
export type Message<T = any> = {
  id?: string;
  data: T;
  event: EventType;
};
