import { env } from "@/env";
import { consumeJobs } from "@/lib/job-queue";
import { startSseHub } from "@/lib/sse-hub";
import { handleTestMessage } from "../consumers/test.consumer";

export default function defineNitroPlugin() {
  // Vitest loads vite.config.ts and so this plugin; endless pollers keep it from exiting.
  if (env.isTest) return;

  console.log("⚙️ Booting up SQS consumers...");

  // Drain the SSE queue from boot, not from the first SSE connection: events published
  // while nobody is connected would otherwise pile up and arrive as a stale burst.
  startSseHub();

  if (env.TEST_QUEUE_URL) {
    consumeJobs(env.TEST_QUEUE_URL, handleTestMessage);
  }
}
