// Manual smoke test for the SQS job queue: `bun run src/tests/messaging.ts`.
// Needs LocalStack up (`docker compose up -d --wait`) and TEST_QUEUE_URL set. Stop the
// app first if it has TEST_QUEUE_URL too, or its worker takes the jobs instead.
import { env } from "@/env";
import { consumeJobs, enqueue } from "@/lib/job-queue";
import { handleTestMessage } from "@/modules/consumers/test.consumer";

async function runTest() {
  const queueUrl = env.TEST_QUEUE_URL;
  if (!queueUrl) throw new Error("Set TEST_QUEUE_URL (see .env.example) to run this test");

  await enqueue(queueUrl, { message: "Hello BoostK!" });
  await enqueue(queueUrl, { ticketId: 123, status: "open" });
  console.log("📤 Enqueued 2 test jobs");

  const consumer = consumeJobs(queueUrl, handleTestMessage);
  setTimeout(() => {
    console.log("⏹ Stopping consumer (waits for the open poll)...");
    consumer.stop().then(() => process.exit(0));
  }, 5000);
}

runTest();
