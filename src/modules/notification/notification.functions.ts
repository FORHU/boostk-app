import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { EventType } from "@/lib/notifier/core";
import { publishEvent } from "@/lib/rabbitmq";

const SendNotificationMessageSchema = z.object({
  targetRoutingKey: z.string(),
  message: z.object({
    event: z.enum(EventType),
    data: z.any(),
  }),
});

export const sendNotificationMessage = createServerFn({ method: "POST" })
  .inputValidator(SendNotificationMessageSchema)
  .handler(async ({ data }) => {
    try {
      const payload = {
        id: Bun.randomUUIDv7(),
        event: data.message.event,
        data: data.message.data,
      };

      await publishEvent(data.targetRoutingKey, payload);

      return { success: true };
    } catch (error) {
      console.error("[notify] Failed to publish notification message:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
