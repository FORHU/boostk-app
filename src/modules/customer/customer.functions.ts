import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { ATTACHMENT_SELECT } from "@/modules/ticket-message/ticket-message.functions";
import { GetCustomerThreadSchema, GetProjectCustomersSchema, type ProjectCustomerSummary } from "./customer.schema";

// Inbox list payload: customer scalars plus the single most recent ticket and its
// latest message, so the sidebar renders without pulling every ticket/message row.
const CUSTOMER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  metadata: true,
  language: true,
  createdAt: true,
  updatedAt: true,
  tickets: {
    take: 1,
    orderBy: { updatedAt: "desc" as const },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      ticketMessages: {
        take: 1,
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true,
          content: true,
          contentType: true,
          createdAt: true,
        },
      },
    },
  },
} as const;

export const getProjectCustomersFn = createServerFn({ method: "GET" })
  .inputValidator(GetProjectCustomersSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    const search = data.search?.trim();

    const rows = await prisma.customer.findMany({
      where: {
        projectId: data.projectId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: CUSTOMER_LIST_SELECT,
      // `id` breaks ties so a cursor never skips or repeats a row.
      orderBy: [{ updatedAt: "desc" as const }, { id: "desc" as const }],
      // Fetch one extra row to detect whether another page exists.
      take: data.take + 1,
      ...(data.cursor ? { cursor: { id: data.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > data.take;
    const page = hasMore ? rows.slice(0, data.take) : rows;

    const customers: ProjectCustomerSummary[] = page.map((row) => {
      const ticket = row.tickets[0];
      const latestMessage = ticket?.ticketMessages[0] ?? null;
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        metadata: row.metadata,
        language: row.language,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        latestTicket: ticket
          ? {
              id: ticket.id,
              referenceNumber: ticket.referenceNumber,
              status: ticket.status,
              priority: ticket.priority,
              createdAt: ticket.createdAt,
              updatedAt: ticket.updatedAt,
              latestMessage,
            }
          : null,
      };
    });

    return {
      customers,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  });

export const getCustomerThreadFn = createServerFn({ method: "GET" })
  .inputValidator(GetCustomerThreadSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.customer.findFirst({
      where: { id: data.customerId, projectId: data.projectId },
      include: {
        project: { select: { id: true, name: true } },
        tickets: {
          orderBy: { updatedAt: "desc" as const },
          include: {
            ticketMessages: {
              orderBy: { createdAt: "asc" as const },
              include: { attachment: ATTACHMENT_SELECT },
            },
          },
        },
      },
    });
  });
