import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel } from "amqplib";
import type { Server } from "socket.io";
import { EventType } from "@/lib/notifier/core";
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
          const routingEvent = rest.join(".");
          // Prefer the explicit `event` on the payload (matches SSE semantics);
          // fall back to the last routing-key segment.
          const event = payload && typeof payload.event === "string" ? payload.event : routingEvent;

          if (scope && id && event) {
            // Relay logging removed to avoid noisy per-message logs
            io.to(`${scope}:${id}`).emit(event, payload.data);
          }

          channel.ack(msg);
        } catch (error) {
          console.error("[Socket.IO] Failed to relay RabbitMQ message:", error);
          channel.nack(msg, false, false);
        }
      });
    },
  });

  relayChannel.on("error", (err) => {
    console.error("[Socket.IO] RabbitMQ Relay Channel Error:", err);

    // Tell every connected client the feed is broken, the way the SSE route already does.
    // This failure is invisible otherwise: the socket itself stays open, so `disconnect`
    // and `connect_error` never fire and the client keeps showing "connected" while no
    // event will ever arrive again. Broadcast rather than per-room — the relay is a single
    // shared consumer, so when it dies it dies for everyone.
    io.emit(EventType.DEGRADED, { reason: "relay_channel_error" });
  });

  // A lost AMQP connection is silent at the channel level — ChannelWrapper._onDisconnect
  // clears its state without emitting anything — so listen one level up, on the
  // ConnectionManager. Without this, clients keep showing "connected" through a broker
  // outage: their sockets never drop and no channel error ever fires.
  connection.on("disconnect", () => {
    io.emit(EventType.DEGRADED, { reason: "rabbitmq_disconnected" });
  });

  // amqp-connection-manager re-establishes this channel on its own; `connect` fires
  // on first setup and after every recovery. Clients that received DEGRADED have no
  // other way back to "connected": their socket stays open through the outage, so
  // neither `disconnect` nor `connect` will fire again.
  relayChannel.on("connect", () => {
    io.emit(EventType.CONNECTED, { reason: "relay_channel_recovered" });
  });

  return relayChannel;
}
