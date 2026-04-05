import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { CreateCustomerSchema } from "@/modules/customer/customer.schema";

export const CreateTicketSchema = z.object({
  referenceNumber: z.string(),
  status: z.enum(TicketStatus).optional().default(TicketStatus.OPEN),
  priority: z.enum(TicketPriority).optional().default(TicketPriority.LOW),
  projectId: z.string(),
  customerId: z.string(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const CreateTicketMessageSchema = z.object({
  content: z.string(),
  contentType: z.string(),
  ticketId: z.string(),
});

export const UpsertTicketSessionInput = CreateCustomerSchema.extend({
  projectId: z.string(),
  referenceNumber: z.string().optional(),
});
export type UpsertTicketSessionInput = z.infer<typeof UpsertTicketSessionInput>;

export const GetTicketByReferenceNumberSchema = z.object({
  referenceNumber: z.string(),
});
export type GetTicketByReferenceNumberInput = z.infer<typeof GetTicketByReferenceNumberSchema>;
