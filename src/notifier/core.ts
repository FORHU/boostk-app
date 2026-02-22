export enum MessageType {
  BROADCAST,
  JOIN,
}

export type Message =
  | {
      type: MessageType.BROADCAST;
      message: string;
    }
  | {
      type: MessageType.JOIN;
    };

export type MessageCallback = (message: Message) => unknown;

export interface Notifier {
  subscribe(channelId: string, callback: MessageCallback): void;
  unsubscribe(channelId: string, callback: MessageCallback): void;

  onBroadcast(channelId: string, message: string): void;
  onJoin(channelId: string): void;
}
