// import { createClient, RedisClientType } from "redis";
// import { MessageCallback, MessageType, Notifier } from "./core";

// export class RedisNotifier implements Notifier {
//   subscribers: Map<MessageCallback, (data: string, channel: string) => unknown>;
//   client: RedisClientType;

//   constructor(url: string) {
//     this.subscribers = new Map();
//     this.client = createClient({
//       url,
//     });

//     this.client.connect();
//   }

//   onBroadcast(channelId: string, message: string): void {
//     this.client.publish(
//       channelId,
//       JSON.stringify({
//         type: MessageType.BROADCAST,
//         message,
//       }),
//     );
//   }

//   onJoin(channelId: string): void {
//     this.client.publish(
//       channelId,
//       JSON.stringify({
//         type: MessageType.JOIN,
//       }),
//     );
//   }

//   subscribe(channelId: string, callback: MessageCallback): void {
//     const redisCallback = (message: string) => callback(JSON.parse(message));

//     this.client.subscribe(channelId, redisCallback);
//     this.subscribers.set(callback, redisCallback);
//   }

//   unsubscribe(channelId: string, callback: MessageCallback): void {
//     const redisCallback = this.subscribers.get(callback);
//     if (!redisCallback) return;

//     this.client.unsubscribe(channelId, redisCallback);
//     this.subscribers.delete(callback);
//   }
// }
