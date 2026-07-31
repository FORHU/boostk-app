import { TicketMessageContentType } from "prisma/generated/enums";
import { z } from "zod";

export const CreateTicketMessageSchema = z.object({
  content: z.string(),
  contentType: z.enum(TicketMessageContentType),
  ticketId: z.string(),
});
export type CreateTicketMessageInput = z.infer<typeof CreateTicketMessageSchema>;

export const CreateCustomerTicketMessageSchema = CreateTicketMessageSchema.extend({
  projectId: z.string(),
});
export type CreateCustomerTicketMessageInput = z.infer<typeof CreateCustomerTicketMessageSchema>;
