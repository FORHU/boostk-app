import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel } from "amqplib";
import type { Server } from "socket.io";
import { connection, EXCHANGE_NAME } from "@/lib/rabbitmq";

const BINDING_PATTERNS = ["user.*.*", "ticket.*.*", "project.*.*"];

/**
 * Relays RabbitMQ events published on the BoostK exchange to connected socket.io
 * clients. A single shared, exclusive consumer is bound to the exchange; each
 * message's routing key (`<scope>.<id>.<event>`) is mapped to a room
 * (`<scope>:<id>`) where the event is re-emitted to its members.
 */
export async function startRealtimeRelay(io: Server): Promise<ChannelWrapper> {
  const relayChannel = connection.createChannel({
    json: true,
    setup: async (channel: ConfirmChannel) => {
      const { queue } = await channel.assertQueue("", { exclusive: true, autoDelete: true });

      for (const pattern of BINDING_PATTERNS) {
        await channel.bindQueue(queue, EXCHANGE_NAME, pattern);
      }

      await channel.consume(queue, (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          const [scope, id, ...rest] = msg.fields.routingKey.split(".");
          const event = rest.join(".");

          if (scope && id && event) {
            console.log(`[Socket.IO] Relaying [${msg.fields.routingKey}] -> ${scope}:${id}`);
            io.to(`${scope}:${id}`).emit(event, payload.data);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("[Socket.IO] Failed to relay RabbitMQ message:", error);
          channel.nack(msg);
        }
      });
    },
  });

  relayChannel.on("error", (err) => {
    console.error("[Socket.IO] RabbitMQ Relay Channel Error:", err);
  });

  return relayChannel;
}
