import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { ATTACHMENT_SELECT } from "@/modules/ticket-message/ticket-message.functions";
import {
  GetCustomerThreadSchema,
  GetProjectCustomerStatsSchema,
  GetProjectCustomersSchema,
  type ProjectCustomerStats,
  type ProjectCustomerSummary,
} from "./customer.schema";

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

    const where = {
      projectId: data.projectId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: CUSTOMER_LIST_SELECT,
        // `id` breaks ties so page boundaries stay stable.
        orderBy: [{ updatedAt: "desc" as const }, { id: "desc" as const }],
        skip: (data.page - 1) * data.pageSize,
        take: data.pageSize,
      }),
    ]);

    // Per-customer ticket aggregates for this page only — the list is paginated,
    // so counting all project tickets here would cost more than it returns.
    // groupBy's literal `by` fields don't typecheck against the generated client,
    // so fetch the ticket scalars and reduce them in JS instead.
    const ids = rows.map((row) => row.id);
    const ticketRows = await prisma.ticket.findMany({
      where: { customerId: { in: ids } },
      select: { customerId: true, status: true, satisfactionScore: true },
    });

    const countByCustomer = new Map<string, { total: number; open: number }>();
    const satisfactionByCustomer = new Map<string, { sum: number; count: number }>();
    for (const row of ticketRows) {
      const entry = countByCustomer.get(row.customerId) ?? { total: 0, open: 0 };
      entry.total += 1;
      if (row.status === "OPEN") entry.open += 1;
      countByCustomer.set(row.customerId, entry);

      if (row.satisfactionScore != null) {
        const agg = satisfactionByCustomer.get(row.customerId) ?? { sum: 0, count: 0 };
        agg.sum += row.satisfactionScore;
        agg.count += 1;
        satisfactionByCustomer.set(row.customerId, agg);
      }
    }

    const customers: ProjectCustomerSummary[] = rows.map((row) => {
      const ticket = row.tickets[0];
      const latestMessage = ticket?.ticketMessages[0] ?? null;
      const counts = countByCustomer.get(row.id) ?? { total: 0, open: 0 };
      const satisfaction = satisfactionByCustomer.get(row.id);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        metadata: row.metadata,
        language: row.language,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        totalTickets: counts.total,
        openTickets: counts.open,
        averageSatisfaction: satisfaction ? satisfaction.sum / satisfaction.count : null,
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
      total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: Math.max(1, Math.ceil(total / data.pageSize)),
    };
  });

export const getProjectCustomerStatsFn = createServerFn({ method: "GET" })
  .inputValidator(GetProjectCustomerStatsSchema)
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data: { projectId } }): Promise<ProjectCustomerStats> => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalCustomers, openTickets, newThisMonth, satisfaction] = await Promise.all([
      prisma.customer.count({ where: { projectId } }),
      prisma.ticket.count({ where: { projectId, status: "OPEN" } }),
      prisma.customer.count({ where: { projectId, createdAt: { gte: startOfMonth } } }),
      prisma.ticket.aggregate({
        where: { projectId, satisfactionScore: { not: null } },
        _avg: { satisfactionScore: true },
      }),
    ]);

    return {
      totalCustomers,
      openTickets,
      newThisMonth,
      averageSatisfaction: satisfaction._avg.satisfactionScore ?? null,
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
