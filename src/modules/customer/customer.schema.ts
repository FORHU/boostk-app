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
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(8),
});
export type GetProjectCustomersInput = z.infer<typeof GetProjectCustomersSchema>;

export const GetCustomerThreadSchema = z.object({
  projectId: z.string(),
  customerId: z.string(),
});
export type GetCustomerThreadInput = z.infer<typeof GetCustomerThreadSchema>;

export const GetProjectCustomerStatsSchema = z.object({
  projectId: z.string(),
});
export type GetProjectCustomerStatsInput = z.infer<typeof GetProjectCustomerStatsSchema>;

/** Project-wide aggregate stats for the Customers page stat cards. */
export type ProjectCustomerStats = {
  totalCustomers: number;
  openTickets: number;
  newThisMonth: number;
  averageSatisfaction: number | null;
};

/**
 * Row for the Customers directory. Latest-message preview plus the ticket
 * aggregates (total/open counts and average CSAT) used to render the table.
 */
export type ProjectCustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  metadata: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalTickets: number;
  openTickets: number;
  averageSatisfaction: number | null;
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
