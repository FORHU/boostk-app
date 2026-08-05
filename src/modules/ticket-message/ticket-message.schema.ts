import { TicketMessageContentType } from "prisma/generated/enums";
import { z } from "zod";

export const CreateTicketMessageSchema = z
  .object({
    content: z.string(),
    contentType: z.enum(TicketMessageContentType),
    ticketId: z.string(),
    // Set for IMAGE/FILE messages: the row created by POST /api/attachments.
    // `content` then carries that attachment's URL rather than typed text.
    attachmentId: z.string().min(1).optional(),
  })
  .refine((v) => v.contentType === "TEXT" || v.attachmentId !== undefined, {
    message: "attachmentId is required for IMAGE and FILE messages",
    path: ["attachmentId"],
  })
  .refine((v) => v.contentType !== "TEXT" || v.content.trim().length > 0, {
    message: "TEXT messages cannot be empty",
    path: ["content"],
  });
export type CreateTicketMessageInput = z.infer<typeof CreateTicketMessageSchema>;

// Spelled out rather than `.extend()`-ing the schema above: `.refine()` returns a
// ZodEffects, which has no `.extend()`.
export const CreateCustomerTicketMessageSchema = z
  .object({
    content: z.string(),
    contentType: z.enum(TicketMessageContentType),
    ticketId: z.string(),
    attachmentId: z.string().min(1).optional(),
    projectId: z.string(),
  })
  .refine((v) => v.contentType === "TEXT" || v.attachmentId !== undefined, {
    message: "attachmentId is required for IMAGE and FILE messages",
    path: ["attachmentId"],
  })
  .refine((v) => v.contentType !== "TEXT" || v.content.trim().length > 0, {
    message: "TEXT messages cannot be empty",
    path: ["content"],
  });
export type CreateCustomerTicketMessageInput = z.infer<typeof CreateCustomerTicketMessageSchema>;
