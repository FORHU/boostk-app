import { TicketPriority, TicketStatus } from "prisma/generated/enums";
import { z } from "zod";
import { CreateCustomerSchema } from "@/modules/customer/customer.schema";

export const CreateTicketSchema = z.object({
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

export const GetProjectTicketsSchema = z.object({
  projectId: z.string().min(1),
  take: z.number().int().min(1).max(50).default(25),
  cursor: z.string().optional(),
});
export type GetProjectTicketsInput = z.infer<typeof GetProjectTicketsSchema>;

export const GetProjectTicketCountsSchema = z.object({
  projectId: z.string().min(1),
});
export type GetProjectTicketCountsInput = z.infer<typeof GetProjectTicketCountsSchema>;
