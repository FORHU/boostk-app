import type { TicketMessageContentType, TicketPriority, TicketStatus } from "prisma/generated/enums";
import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  metadata: z.string().optional(),
  projectId: z.string(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const GetProjectCustomersSchema = z.object({
  projectId: z.string(),
  search: z.string().max(200).optional(),
  take: z.number().int().min(1).max(50).default(25),
  cursor: z.string().optional(),
});
export type GetProjectCustomersInput = z.infer<typeof GetProjectCustomersSchema>;

export const GetCustomerThreadSchema = z.object({
  projectId: z.string(),
  customerId: z.string(),
});
export type GetCustomerThreadInput = z.infer<typeof GetCustomerThreadSchema>;

/** Latest-message preview for the inbox sidebar. At most one ticket + one message per customer. */
export type ProjectCustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  metadata: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
  latestTicket: {
    id: string;
    referenceNumber: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: Date;
    updatedAt: Date;
    latestMessage: {
      id: string;
      content: string;
      contentType: TicketMessageContentType;
      createdAt: Date;
    } | null;
  } | null;
};
