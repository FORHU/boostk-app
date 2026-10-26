// Realtime event bus on SNS + SQS.
//
// Publishers send each event to one SNS topic, tagged with a `routingKey` message
// attribute shaped `<scope>.<id>.<event>` (e.g. `user.<userId>.chat_message`). Every
// consuming process -- the app's SSE route and the socket relay -- has its own SQS queue
// subscribed to the topic with raw message delivery, so each one receives every event
// and routes it in memory. SQS alone cannot do this: a queue hands each message to ONE
// receiver, so two processes sharing a queue would each see half the events.
//
// The realtime queues keep messages for 60s and carry no DLQ: a live notification that
// could not be delivered within a minute is stale, and the client refetches on reconnect.

import { setTimeout as sleep } from "node:timers/promises";
import { PublishBatchCommand, PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message as SqsMessage,
} from "@aws-sdk/client-sqs";
import { env } from "@/env";

const clientConfig = {
  region: env.AWS_REGION,
  ...(env.AWS_MESSAGING_ENDPOINT ? { endpoint: env.AWS_MESSAGING_ENDPOINT } : {}),
};

export const sns = new SNSClient(clientConfig);
export const sqs = new SQSClient(clientConfig);

const ROUTING_KEY_ATTRIBUTE = "routingKey";
/** SNS PublishBatch and SQS DeleteMessageBatch both cap a batch at 10 entries. */
const MAX_BATCH = 10;
const RECEIVE_RETRY_MS = 5000;

const routingKeyAttribute = (routingKey: string) => ({
  [ROUTING_KEY_ATTRIBUTE]: { DataType: "String", StringValue: routingKey },
});

export const publishEvent = async <T>(routingKey: string, data: T): Promise<void> => {
  await sns.send(
    new PublishCommand({
      TopicArn: env.EVENTS_TOPIC_ARN,
      Message: JSON.stringify(data),
      MessageAttributes: routingKeyAttribute(routingKey),
    }),
  );
};

/**
 * Publish one payload on many routing keys -- e.g. the same notification to every agent's
 * `user.<id>.<event>` key -- in batches of 10 instead of one request per recipient.
 */
export const publishEventToMany = async <T>(routingKeys: string[], data: T): Promise<void> => {
  const message = JSON.stringify(data);
  const batches: string[][] = [];
  for (let i = 0; i < routingKeys.length; i += MAX_BATCH) batches.push(routingKeys.slice(i, i + MAX_BATCH));

  await Promise.all(
    batches.map(async (keys) => {
      const result = await sns.send(
        new PublishBatchCommand({
          TopicArn: env.EVENTS_TOPIC_ARN,
          PublishBatchRequestEntries: keys.map((routingKey, index) => ({
            Id: String(index),
            Message: message,
            MessageAttributes: routingKeyAttribute(routingKey),
          })),
        }),
      );
      // A batch call succeeds as a whole even when some entries are rejected.
      if (result.Failed?.length) {
        const reasons = result.Failed.map((entry) => `${keys[Number(entry.Id)]}: ${entry.Code}`).join(", ");
        throw new Error(`SNS rejected ${result.Failed.length} of ${keys.length} events (${reasons})`);
      }
    }),
  );
};

export type EventHandler = (routingKey: string, payload: unknown) => void;

export interface EventSubscription {
  /** Stops polling. Resolves once the open long poll (up to 20s) has returned. */
  stop(): Promise<void>;
}

/**
 * Long-polls a realtime queue and hands every event to `onEvent`. Messages are deleted
 * whether or not the handler succeeds -- the same no-requeue rule the RabbitMQ consumers
 * used, so one bad payload cannot loop forever.
 *
 * `onDegraded` fires on every failed receive (retried every 5s) and `onRecovered` on the
 * first success after a failure, so callers can tell clients the feed is down rather than
 * leaving them looking connected while nothing arrives.
 */
export function subscribeToEvents(
  queueUrl: string,
  onEvent: EventHandler,
  { onDegraded, onRecovered }: { onDegraded?: (err: unknown) => void; onRecovered?: () => void } = {},
): EventSubscription {
  const abort = new AbortController();
  let degraded = false;

  const loop = (async () => {
    while (!abort.signal.aborted) {
      let messages: SqsMessage[];
      try {
        const result = await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: MAX_BATCH,
            WaitTimeSeconds: 20,
            MessageAttributeNames: [ROUTING_KEY_ATTRIBUTE],
          }),
          // No abortSignal on purpose: SQS does not see a cancelled poll and may still hand
          // it messages, which would then sit invisible until their visibility timeout.
        );
        messages = result.Messages ?? [];
      } catch (err) {
        degraded = true;
        console.error(`[messaging] Receive failed on ${queueUrl}:`, err);
        onDegraded?.(err);
        await sleep(RECEIVE_RETRY_MS, undefined, { signal: abort.signal }).catch(() => {});
        continue;
      }

      if (degraded) {
        degraded = false;
        onRecovered?.();
      }
      if (messages.length === 0) continue;

      for (const message of messages) {
        const routingKey = message.MessageAttributes?.[ROUTING_KEY_ATTRIBUTE]?.StringValue;
        try {
          if (!routingKey) throw new Error("message has no routingKey attribute");
          onEvent(routingKey, JSON.parse(message.Body ?? ""));
        } catch (err) {
          console.error(`[messaging] Dropping event ${message.MessageId} from ${queueUrl}:`, err);
        }
      }

      await sqs
        .send(
          new DeleteMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: messages.map((message, index) => ({ Id: String(index), ReceiptHandle: message.ReceiptHandle })),
          }),
        )
        // Undeleted events reappear after the visibility timeout and are delivered twice.
        // A duplicate notification is better than a dead loop.
        .catch((err) => console.error(`[messaging] Delete failed on ${queueUrl}:`, err));
    }
  })();

  return {
    stop: async () => {
      abort.abort();
      await loop;
    },
  };
}
