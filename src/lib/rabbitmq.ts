import amqp from "amqp-connection-manager";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

const PERMANENT_QUEUES = ["test.queue"];
export const EXCHANGE_NAME = "boostk.exchange";
const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://127.0.0.1:5672";

export const connection = amqp.connect([RABBIT_URL]);

connection.on("connect", () => console.log("✅ RabbitMQ: Connected"));
connection.on("disconnect", (err) => console.error("❌ RabbitMQ: Disconnected", err.err.message));

export const channelWrapper = connection.createChannel({
  json: true,
  setup: async (channel: ConfirmChannel) => {
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    for (const queueName of PERMANENT_QUEUES) {
      await channel.assertQueue(queueName, { durable: true });
    }

    await channel.bindQueue("test.queue", EXCHANGE_NAME, "test.#");
  },
});

export const publishMessage = async <T>(queue: string, data: T): Promise<void> => {
  await channelWrapper.sendToQueue(queue, data, { persistent: true });
};

export const publishEvent = async <T>(routingKey: string, data: T): Promise<void> => {
  await channelWrapper.publish(EXCHANGE_NAME, routingKey, data, { persistent: true });
};

export const consumeTestQueue = async () => {
  await channelWrapper.addSetup(async (channel: ConfirmChannel) => {
    await channel.consume("test.queue", (msg: ConsumeMessage | null) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(`📥 Received on [test.queue] via [${routingKey}]:`, payload);

        channel.ack(msg);
      }
    });
  });
};

export const startBackgroundConsumer = async (
  queueName: string,
  routingKeyPattern: string,
  onMessage: (data: unknown, routingKey: string) => Promise<void>,
) => {
  // We use channelWrapper.addSetup so that if RabbitMQ restarts,
  // this consumer automatically re-connects and binds itself again!
  await channelWrapper.addSetup(async (channel: ConfirmChannel) => {
    // Ensure the durable queue exists
    await channel.assertQueue(queueName, { durable: true });

    // Bind it to our main BoostK exchange using the wildcard pattern
    await channel.bindQueue(queueName, EXCHANGE_NAME, routingKeyPattern);

    // Start consuming (receive messages)
    await channel.consume(queueName, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());

        // Pass to business logic
        await onMessage(data, msg.fields.routingKey);

        // Acknowledge the message (remove from queue)
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ Background Consumer Error on ${queueName}:`, err);
        // Nack without requeueing to prevent an infinite crash loop for bad data
        channel.nack(msg, false, false);
      }
    });
  });
};
