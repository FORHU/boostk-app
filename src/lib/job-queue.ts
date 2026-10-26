// Background jobs on plain SQS: one queue per job type, each with a `-dlq` twin.
//
// Unlike the realtime bus in `lib/messaging.ts`, a job is meant for exactly ONE worker,
// which is what an SQS queue does natively. Failed jobs are retried after
// `retryDelaySeconds` and moved to the DLQ after the queue's maxReceiveCount (5, set by
// the provisioning script). Delivery is at-least-once: handlers must be idempotent.
//
// Every queue needs exactly one `consumeJobs` per process that should work it; never point
// two different job types at the same queue.

import { setTimeout as sleep } from "node:timers/promises";
import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "./messaging";

/** Queues a job. `delaySeconds` is capped at 900 by SQS. */
export async function enqueue(queueUrl: string, job: unknown, delaySeconds?: number): Promise<string | undefined> {
  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(job),
      ...(delaySeconds ? { DelaySeconds: delaySeconds } : {}),
    }),
  );
  return result.MessageId;
}

export type JobHandler = (job: unknown) => Promise<void>;

export interface ConsumeJobsOptions {
  /** Jobs run at the same time. Also the batch size per poll, so SQS caps it at 10. */
  concurrency?: number;
  /** Seconds a received job stays hidden from other workers. Renewed while it runs. */
  visibilityTimeout?: number;
  /** Seconds before a failed job is retried. */
  retryDelaySeconds?: number;
}

export interface JobConsumer {
  /** Stops polling and resolves once running jobs finish (plus up to 20s for an open poll). */
  stop(): Promise<void>;
}

export function consumeJobs(
  queueUrl: string,
  handle: JobHandler,
  { concurrency = 1, visibilityTimeout = 300, retryDelaySeconds = 30 }: ConsumeJobsOptions = {},
): JobConsumer {
  const abort = new AbortController();
  const batchSize = Math.max(1, Math.min(concurrency, 10));

  const loop = (async () => {
    while (!abort.signal.aborted) {
      let messages: Message[];
      try {
        const result = await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            // Receive only what can start right away: a message waiting behind another job
            // is not renewed, so its timeout lapses and a second worker picks it up.
            MaxNumberOfMessages: batchSize,
            WaitTimeSeconds: 20,
            VisibilityTimeout: visibilityTimeout,
            MessageSystemAttributeNames: ["ApproximateReceiveCount"],
          }),
          // No abortSignal: see the same note in lib/messaging.ts.
        );
        messages = result.Messages ?? [];
      } catch (err) {
        console.warn(`[job-queue] Receive failed on ${queueUrl}:`, err);
        await sleep(5000, undefined, { signal: abort.signal }).catch(() => {});
        continue;
      }

      if (abort.signal.aborted) {
        // Received while shutting down: hand them straight back to another worker.
        await Promise.all(messages.map((message) => setVisibility(queueUrl, message, 0)));
        break;
      }
      await Promise.all(
        messages.map((message) => runJob(queueUrl, message, handle, visibilityTimeout, retryDelaySeconds)),
      );
    }
  })();

  return {
    stop: async () => {
      abort.abort();
      await loop;
    },
  };
}

function setVisibility(queueUrl: string, message: Message, seconds: number): Promise<unknown> {
  return sqs
    .send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: seconds,
      }),
    )
    .catch(() => {});
}

/** Never throws, so one bad job cannot stop the loop. */
async function runJob(
  queueUrl: string,
  message: Message,
  handle: JobHandler,
  visibilityTimeout: number,
  retryDelaySeconds: number,
): Promise<void> {
  const context = { queueUrl, messageId: message.MessageId, receiveCount: message.Attributes?.ApproximateReceiveCount };
  const deleteMessage = () =>
    sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: message.ReceiptHandle }));

  let job: unknown;
  try {
    job = JSON.parse(message.Body ?? "");
  } catch {
    // It can never succeed, so log it and drop it instead of retrying into the DLQ.
    console.error("[job-queue] Dropping malformed job", { ...context, body: message.Body?.slice(0, 500) });
    await deleteMessage().catch(() => {});
    return;
  }

  // Keep the job hidden while it runs, or another worker picks it up mid-job.
  const heartbeat = setInterval(
    () => setVisibility(queueUrl, message, visibilityTimeout),
    Math.max(1000, (visibilityTimeout * 1000) / 3),
  );

  try {
    await handle(job);
    await deleteMessage();
  } catch (err) {
    // Not deleted: SQS redelivers it after the retry delay, and moves it to the DLQ once
    // it has been received maxReceiveCount times.
    console.error("[job-queue] Job failed", { ...context, err });
    await setVisibility(queueUrl, message, retryDelaySeconds);
  } finally {
    clearInterval(heartbeat);
  }
}
