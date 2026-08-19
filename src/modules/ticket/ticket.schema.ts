import { type TicketMessageContentType, TicketPriority, TicketStatus } from "prisma/generated/enums";
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

export const TICKET_SORT_OPTIONS = ["newest", "oldest", "priority"] as const;
export type TicketSort = (typeof TICKET_SORT_OPTIONS)[number];

export const GetProjectTicketsSchema = z.object({
  projectId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  statusFilter: z.enum(["ALL", "OPEN", "CLOSED"]).default("ALL"),
  searchQuery: z.string().optional(),
  sort: z.enum(TICKET_SORT_OPTIONS).default("newest"),
});
export type GetProjectTicketsInput = z.infer<typeof GetProjectTicketsSchema>;

export const GetProjectTicketCountsSchema = z.object({
  projectId: z.string().min(1),
});
export type GetProjectTicketCountsInput = z.infer<typeof GetProjectTicketCountsSchema>;

export const TICKET_INBOX_SCOPE_OPTIONS = ["ALL", "MINE", "UNASSIGNED"] as const;
export type TicketInboxScope = (typeof TICKET_INBOX_SCOPE_OPTIONS)[number];

export const GetProjectTicketInboxSchema = z.object({
  projectId: z.string().min(1),
  statusFilter: z.enum(["ALL", "OPEN", "CLOSED"]).default("ALL"),
  scope: z.enum(TICKET_INBOX_SCOPE_OPTIONS).default("ALL"),
  search: z.string().max(200).optional(),
  take: z.number().int().min(1).max(50).default(15),
  cursor: z.string().optional(),
});
export type GetProjectTicketInboxInput = z.infer<typeof GetProjectTicketInboxSchema>;

/** Latest-message preview for the Chat Support inbox sidebar. One row per ticket. */
export type ProjectTicketSummary = {
  id: string;
  referenceNumber: string;
  status: TicketStatus;
  priority: TicketPriority;
  satisfactionScore: number | null;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    language: string | null;
    metadata: string | null;
    createdAt: Date;
  };
  latestMessage: {
    id: string;
    content: string;
    contentType: TicketMessageContentType;
    createdAt: Date;
  } | null;
};

export type ProjectTicketInboxPage = { tickets: ProjectTicketSummary[]; nextCursor: string | null };

/**
 * A customer's CSAT rating of a closed project-widget conversation: 1-5 stars. Written
 * once, guarded by the ticket cookie — the same credential that authorizes messaging,
 * scoped to `projectId` so a visitor can only ever rate their own ticket.
 */
export const RateTicketSchema = z.object({
  projectId: z.string().min(1),
  ticketId: z.string().min(1),
  score: z.number().int().min(1).max(5),
});
export type RateTicketInput = z.infer<typeof RateTicketSchema>;
