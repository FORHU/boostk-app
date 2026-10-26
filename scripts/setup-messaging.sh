#!/bin/sh
# Creates BOOSTK's messaging resources. Safe to re-run: every step finds or updates the
# existing resource instead of failing.
#
#   SNS topic  <prefix>-events            realtime events, tagged with a routingKey attribute
#   SQS queue  <prefix>-realtime-relay    subscribed to the topic; drained by the socket relay
#   SQS queue  <prefix>-realtime-sse      subscribed to the topic; drained by the app's SSE route
#   SQS queue  <prefix>-<job> (+ -dlq)    one per entry in JOB_QUEUES, for background jobs
#
# Local:  LocalStack runs this on every start (docker-compose.yaml mounts it into ready.d
#         with MESSAGING_CLI=awslocal), because the free image keeps queues in memory.
# AWS:    AWS_REGION=ap-southeast-1 JOB_QUEUES= sh scripts/setup-messaging.sh
#         with credentials that may create SNS topics and SQS queues. Copy the printed
#         values into the GitHub variables deploy.yml writes into app.env.
#
# Keep LF line endings (.gitattributes enforces it): a CRLF copy fails inside LocalStack.
set -eu

CLI="${MESSAGING_CLI:-aws}"
# MESSAGING_REGION first: LocalStack sets its own AWS_REGION (us-east-1) inside the container.
REGION="${MESSAGING_REGION:-${AWS_REGION:-ap-southeast-1}}"
PREFIX="${MESSAGING_PREFIX:-boostk}"
# `-` not `:-`, so JOB_QUEUES= (empty) means "no job queues" rather than the default.
JOB_QUEUES="${JOB_QUEUES-test}"
# Failed receives before a job moves to its DLQ.
MAX_RECEIVES="${QUEUE_MAX_RECEIVES:-5}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cli() { $CLI --region "$REGION" "$@"; }
create_queue() { cli sqs create-queue --queue-name "$1" --query QueueUrl --output text; }
queue_arn() {
  cli sqs get-queue-attributes --queue-url "$1" --attribute-names QueueArn --query Attributes.QueueArn --output text
}

topic_arn=$(cli sns create-topic --name "$PREFIX-events" --query TopicArn --output text)
echo "EVENTS_TOPIC_ARN=$topic_arn"

# Realtime queues. Each consuming process needs its own: SQS hands a message to ONE
# receiver, so two processes on one queue would each see half the events.
for consumer in relay sse; do
  url=$(create_queue "$PREFIX-realtime-$consumer")
  arn=$(queue_arn "$url")

  # 60s retention (the SQS minimum): a live notification older than that is stale.
  # The policy lets only this topic deliver into the queue; real SQS drops SNS
  # deliveries without it. Policy is a JSON string inside JSON, so it goes via a file.
  cat > "$TMP/attributes.json" <<EOF
{
  "MessageRetentionPeriod": "60",
  "VisibilityTimeout": "30",
  "Policy": "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"$arn\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"$topic_arn\"}}}]}"
}
EOF
  cli sqs set-queue-attributes --queue-url "$url" --attributes "file://$TMP/attributes.json"

  # Raw delivery: the queue receives the published JSON as-is, with the routingKey
  # attribute carried over as an SQS message attribute (not wrapped in an SNS envelope).
  cli sns subscribe --topic-arn "$topic_arn" --protocol sqs --notification-endpoint "$arn" \
    --attributes RawMessageDelivery=true --query SubscriptionArn --output text > /dev/null

  echo "$(echo "$consumer" | tr '[:lower:]' '[:upper:]')_QUEUE_URL=$url"
done

# Background job queues, each with a DLQ.
for job in $JOB_QUEUES; do
  dlq_url=$(create_queue "$PREFIX-$job-dlq")
  dlq_arn=$(queue_arn "$dlq_url")
  url=$(create_queue "$PREFIX-$job")

  cat > "$TMP/redrive.json" <<EOF
{"RedrivePolicy": "{\"deadLetterTargetArn\":\"$dlq_arn\",\"maxReceiveCount\":\"$MAX_RECEIVES\"}"}
EOF
  cli sqs set-queue-attributes --queue-url "$url" --attributes "file://$TMP/redrive.json"

  echo "$(echo "$job" | tr '[:lower:]-' '[:upper:]_')_QUEUE_URL=$url  (dlq: $PREFIX-$job-dlq, max receives: $MAX_RECEIVES)"
done

echo "messaging ready (region: $REGION)"
