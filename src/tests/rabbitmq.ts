import { channelWrapper, consumeTestQueue, EXCHANGE_NAME } from "@/lib/rabbitmq";

export const publishEvent = async <T>(routingKey: string, data: T): Promise<void> => {
  await channelWrapper.publish(EXCHANGE_NAME, routingKey, data, { persistent: true });
  console.log(`📤 Published event [${routingKey}]`);
};

async function runTest() {
  await consumeTestQueue();

  setTimeout(() => {
    publishEvent("test.ping", { message: "Hello BoostK!" });
    publishEvent("test.ticket.created", { ticketId: 123, status: "open" });
  }, 2000);
}

runTest();
