import { startBackgroundConsumer } from "@/lib/rabbitmq";
import { handleTestMessage } from "../consumers/test.consumer";

export default function defineNitroPlugin() {
  console.log("⚙️ Booting up RabbitMQ Background Workers...");

  startBackgroundConsumer("test.queue", "test.queue", handleTestMessage).catch(console.error);
}
