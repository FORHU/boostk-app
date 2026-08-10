import {
  TicketMessageContentType as ContentType,
  type TicketMessageContentType,
  type TicketStatus,
} from "prisma/generated/enums";
import { z } from "zod";

/**
 * A message sent from the public global chat. Spelled out rather than `.omit()`-ing
 * `CreateCustomerTicketMessageSchema` — that schema ends in `.refine()`, which returns a
 * ZodEffects with no `.omit()` (the same reason it could not `.extend()` its own base).
 *
 * `projectId` is deliberately absent: an intake chat has no project the visitor could
 * name, and after routing it belongs to one they must not be able to influence. The
 * cookie's reference number is the only thing that decides which ticket is written to.
 */
export const CreateIntakeMessageSchema = z
  .object({
    content: z.string(),
    contentType: z.enum(ContentType),
    ticketId: z.string(),
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
export type CreateIntakeMessageInput = z.infer<typeof CreateIntakeMessageSchema>;

/**
 * What a visitor supplies to open a global chat. Mirrors CreateCustomerSchema minus
 * `projectId` — the whole point of intake is that no project is known yet.
 */
export const StartIntakeChatSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.email("Invalid email address"),
  phone: z.string().max(40).optional(),
  /** Free-text "what is this about" captured on the intake form to help triage. */
  subject: z.string().max(200).optional(),
});
export type StartIntakeChatInput = z.infer<typeof StartIntakeChatSchema>;

/**
 * A BOOSTK staff reply sent from the triage panel, before the conversation belongs to any
 * organization. Separate from the agent reply schema because the authority behind it is
 * different — platform staff, not an org member — and because it can only ever target a
 * ticket still sitting in the intake queue.
 */
export const CreateTriageMessageSchema = z.object({
  intakeTicketId: z.string(),
  content: z.string().trim().min(1, "Message cannot be empty").max(4000),
});
export type CreateTriageMessageInput = z.infer<typeof CreateTriageMessageSchema>;

export const RouteIntakeTicketSchema = z.object({
  intakeTicketId: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
});
export type RouteIntakeTicketInput = z.infer<typeof RouteIntakeTicketSchema>;

export const CloseIntakeTicketSchema = z.object({
  intakeTicketId: z.string(),
  /** Recorded on the closing note so the queue shows why nothing was routed. */
  reason: z.enum(["spam", "no_fit", "resolved"]),
});
export type CloseIntakeTicketInput = z.infer<typeof CloseIntakeTicketSchema>;

export const GetTriageQueueSchema = z.object({
  search: z.string().max(200).optional(),
  take: z.number().int().min(1).max(50).default(25),
  cursor: z.string().optional(),
});
export type GetTriageQueueInput = z.infer<typeof GetTriageQueueSchema>;

/** One row in the BOOSTK triage queue. */
export type TriageQueueItem = {
  id: string;
  referenceNumber: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    language: string | null;
    /** The intake form's `subject`, stored on Customer.metadata. */
    metadata: string | null;
  };
  latestMessage: {
    id: string;
    content: string;
    contentType: TicketMessageContentType;
    createdAt: Date;
  } | null;
  messageCount: number;
};
