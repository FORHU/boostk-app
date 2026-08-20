import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Pagination } from "@/components/Pagination";
import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
import { TicketSortSelect } from "@/components/tickets/TicketSortSelect";
import { TicketsLoadingFallback } from "@/components/tickets/TicketsLoadingFallback";
import { TICKET_TABLE_COLUMNS, TicketsTableRow } from "@/components/tickets/TicketsTableRow";
import { EmptyState } from "@/components/ui/empty-state";
import { useNotification } from "@/contexts/notification-context";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { useResponsivePageSize } from "@/hooks/use-responsive-page-size";
import { useSocket } from "@/hooks/use-socket";
import { useViewport } from "@/hooks/use-viewport";
import { EventType } from "@/lib/notifier/core";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/rabbitmq";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { memberQueries } from "@/modules/members/member.queries";
import { publishToProjectAgents } from "@/modules/notification/notification.publish";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { getProjectTicketCountsFn, getProjectTicketsFn } from "@/modules/ticket/ticket.functions";
import { TICKET_SORT_OPTIONS, type TicketSort } from "@/modules/ticket/ticket.schema";
import { assignTicket } from "@/modules/ticket/ticket.service";

// 1. Fetching Functions (Agent-only). The paginated ticket list lives in
// ticket.functions.ts; the single-ticket detail and mutations stay local.
export const getTicketByIdFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string(), ticketId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.ticket.findUnique({
      where: { id: data.ticketId, projectId: data.projectId },
      include: {
        customer: true,
        assignedAgent: { include: { user: true } },
        ticketMessages: {
          orderBy: { createdAt: "asc" as const },
        },
      },
    });
  });

export const updateTicketStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      projectId: z.string(),
      ticketId: z.string(),
      status: z.enum(["OPEN", "CLOSED"]),
    }),
  )
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data, context }) => {
    // Admins (and the org owner) may change the status of any ticket in the
    // project; regular agents may only change tickets assigned to them.
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId, projectId: data.projectId },
        select: { assignedAgentId: true },
      });
      if (!ticket || ticket.assignedAgentId !== context.memberId) {
        throw new Error("You can only change the status of tickets assigned to you.");
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: data.ticketId,
        projectId: data.projectId,
      },
      data: { status: data.status },
    });

    // Notify listeners about the status change
    await publishEvent(`ticket.${data.ticketId}.status`, {
      event: EventType.TICKET_STATUS_CHANGED,
      data: { ticketId: data.ticketId, status: data.status },
    });

    return updatedTicket;
  });

export const updateTicketPriorityFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      projectId: z.string(),
      ticketId: z.string(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    }),
  )
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data, context }) => {
    // Admins (and the org owner) may set the priority of any ticket in the
    // project; regular agents may only change tickets assigned to them.
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId, projectId: data.projectId },
        select: { assignedAgentId: true },
      });
      if (!ticket || ticket.assignedAgentId !== context.memberId) {
        throw new Error("You can only change the priority of tickets assigned to you.");
      }
    }

    return prisma.ticket.update({
      where: {
        id: data.ticketId,
        projectId: data.projectId,
      },
      data: { priority: data.priority },
    });
  });

export const assignTicketFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      projectId: z.string(),
      ticketId: z.string(),
      // Member id of the agent taking the ticket, or null to unassign.
      assignedAgentId: z.string().nullable(),
    }),
  )
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data, context }) => {
    const isAdmin = hasOrgRole(context.role, ORG_ROLE.ADMIN);

    // Admins (and the org owner) may assign any agent. Regular agents may only
    // assign tickets to themselves.
    if (!isAdmin && data.assignedAgentId !== null && data.assignedAgentId !== context.memberId) {
      throw new Error("Agents can only assign tickets to themselves.");
    }

    // Regular agents may only unassign tickets that are currently unassigned or
    // assigned to them.
    if (!isAdmin && data.assignedAgentId === null) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId, projectId: data.projectId },
        select: { assignedAgentId: true },
      });
      if (!ticket || (ticket.assignedAgentId !== null && ticket.assignedAgentId !== context.memberId)) {
        throw new Error("You can only unassign tickets assigned to you.");
      }
    }

    const updatedTicket = await assignTicket(data);

    // Notify every agent of the project so their ticket lists refresh live.
    await publishToProjectAgents({
      projectId: data.projectId,
      event: EventType.TICKET_ASSIGNED,
      data: {
        ticketId: data.ticketId,
        assignedAgentId: data.assignedAgentId,
      },
    });

    return updatedTicket;
  });

// 2. Query Options
export const projectTicketQueries = {
  tickets: ["project-tickets"],
  listPrefix: (projectId: string) => [...projectTicketQueries.tickets, projectId],
  list: (
    projectId: string,
    params: { page: number; pageSize: number; sort: TicketSort; statusFilter: string; searchQuery: string },
  ) => ({
    queryKey: [
      ...projectTicketQueries.listPrefix(projectId),
      "list",
      params.page,
      params.pageSize,
      params.sort,
      params.statusFilter,
      params.searchQuery,
    ],
    queryFn: () =>
      getProjectTicketsFn({
        data: {
          projectId,
          page: params.page,
          pageSize: params.pageSize,
          sort: params.sort,
          statusFilter: params.statusFilter as "ALL" | "OPEN" | "CLOSED",
          searchQuery: params.searchQuery || undefined,
        },
      }),
  }),
  counts: (projectId: string) =>
    queryOptions({
      queryKey: [...projectTicketQueries.listPrefix(projectId), "counts"],
      queryFn: () => getProjectTicketCountsFn({ data: { projectId } }),
    }),
  detailById: (projectId: string, ticketId: string) =>
    queryOptions({
      queryKey: [...projectTicketQueries.tickets, "detail", ticketId],
      queryFn: () => getTicketByIdFn({ data: { projectId, ticketId } }),
    }),
};

// URL Search Schema validation
const ticketSearchSchema = z.object({
  selectedTicketId: z.string().optional().catch(undefined),
  statusFilter: z.string().default("ALL").catch("ALL"),
  searchQuery: z.string().optional().catch(undefined),
  sort: z.enum(TICKET_SORT_OPTIONS).default("newest"),
  page: z.number().int().min(1).optional().catch(1),
});

export const Route = createFileRoute("/(app)/dashboard/project/$projectSlug/tickets")({
  validateSearch: (search) => ticketSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({
        to: "/dashboard/organizations",
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED },
      });
    }
  },
  pendingComponent: TicketsLoadingFallback,
  component: ProjectTicketsPage,
});

function ProjectTicketsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { authSession, project, role, memberId } = Route.useRouteContext();
  const projectId = project.id;
  const organizationId = project.organizationId;
  const queryClient = useQueryClient();
  const selectedTicketId = search.selectedTicketId ?? null;
  const { markAsRead } = useNotification();

  const canEditAnyTicket = hasOrgRole(role, ORG_ROLE.ADMIN);

  const agentsQuery = useQuery({
    ...memberQueries.orgAgents(organizationId),
    enabled: !!organizationId,
  });
  const agents = (agentsQuery.data ?? [])
    .filter((member) => hasOrgRole(member.role, ORG_ROLE.AGENT))
    .map((member) => ({ id: member.id, name: member.user?.name ?? member.user?.email ?? "Unknown agent" }));

  // Realtime: keep the open conversation and the ticket list fresh when new
  // events arrive over socket.io (agent dashboards do not send these messages).
  const { lastMessage } = useSocket({ userId: authSession?.user.id });

  useEffect(() => {
    if (!lastMessage) return;

    if (
      lastMessage.event === EventType.CHAT_MESSAGE &&
      selectedTicketId &&
      lastMessage.data?.ticketId === selectedTicketId
    ) {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, selectedTicketId).queryKey,
      });
    }

    if (lastMessage.event === EventType.TICKET_CREATED) {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    }

    if (lastMessage.event === EventType.TICKET_ASSIGNED) {
      const assignedTicketId = lastMessage.data?.ticketId;
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
      if (assignedTicketId && selectedTicketId === assignedTicketId) {
        queryClient.invalidateQueries({
          queryKey: projectTicketQueries.detailById(projectId, assignedTicketId).queryKey,
        });
      }
    }

    if (lastMessage.event === EventType.TICKET_STATUS_CHANGED) {
      const changedTicketId = lastMessage.data?.ticketId;
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
      if (changedTicketId && selectedTicketId === changedTicketId) {
        queryClient.invalidateQueries({
          queryKey: projectTicketQueries.detailById(projectId, changedTicketId).queryKey,
        });
      }
    }
  }, [lastMessage, selectedTicketId, projectId, queryClient]);

  const statusFilter = search.statusFilter.toUpperCase();
  const searchQuery = search.searchQuery ?? "";
  const sort = search.sort;
  const page = search.page ?? 1;

  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(inputValue);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery === searchQuery) return;
    navigate({
      search: (prev) => ({ ...prev, searchQuery: debouncedSearchQuery || undefined, page: 1 }),
      replace: true,
    });
  }, [debouncedSearchQuery, searchQuery, navigate]);

  const { isMobile, isMounted } = useViewport();
  const pageSize = useResponsivePageSize();

  const ticketsQuery = useQuery({
    ...projectTicketQueries.list(projectId, { page, pageSize, sort, statusFilter, searchQuery }),
    placeholderData: (prev) => prev,
  });
  const tickets = ticketsQuery.data?.tickets ?? [];
  const total = ticketsQuery.data?.total ?? 0;
  const totalPages = ticketsQuery.data?.totalPages ?? 1;

  // Clamp the page when the dataset shrinks (e.g. tickets closed on the last page).
  useEffect(() => {
    if (ticketsQuery.isSuccess && page > totalPages) {
      navigate({ search: (prev) => ({ ...prev, page: totalPages }), replace: true });
    }
  }, [ticketsQuery.isSuccess, page, totalPages, navigate]);

  const { data: counts } = useSuspenseQuery(projectTicketQueries.counts(projectId));

  const getCount = (status: string) => {
    if (!counts) return 0;
    if (status === "ALL") return counts.total;
    if (status === "OPEN") return counts.open;
    if (status === "CLOSED") return counts.closed;
    return 0;
  };

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "Closed", value: "CLOSED" },
  ];

  const clearSelection = () =>
    navigate({
      search: (prev) => ({ ...prev, selectedTicketId: undefined }),
    });

  const goToPage = (nextPage: number) =>
    navigate({
      search: (prev) => ({ ...prev, page: nextPage }),
      replace: true,
    });

  if (!isMounted) {
    return <TicketsLoadingFallback />;
  }

  if (ticketsQuery.isPending && tickets.length === 0) {
    return <TicketsLoadingFallback />;
  }

  return (
    <div className={`max-w-7xl mx-auto w-full overflow-hidden ${isMobile ? "p-4" : "p-6"}`}>
      {isMobile ? (
        selectedTicketId ? (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <TicketDetailPanel
              projectId={projectId}
              organizationId={organizationId}
              ticketId={selectedTicketId}
              onBack={clearSelection}
              onClose={clearSelection}
              memberId={memberId}
              canEditAnyTicket={canEditAnyTicket}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and resolve customer support tickets for this project.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Search..."
                className="p-2 border rounded-md w-full"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {filterTabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.value}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({ ...prev, statusFilter: tab.value, page: 1 }),
                      })
                    }
                    className={`px-4 py-2 text-sm font-medium rounded-sm whitespace-nowrap ${
                      statusFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {tab.label} ({getCount(tab.value)})
                  </button>
                ))}
                <TicketSortSelect
                  sort={sort}
                  onSortChange={(nextSort) =>
                    navigate({
                      search: (prev) => ({ ...prev, sort: nextSort, page: 1 }),
                      replace: true,
                    })
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground md:hidden">
              Showing {tickets.length} of {total} tickets
            </p>

            {total === 0 ? (
              <EmptyState
                icon={<X className="size-10" strokeWidth={1} />}
                title={searchQuery ? "Reference doesn't match" : `No ${statusFilter.toLowerCase()} tickets found`}
                description={
                  searchQuery
                    ? "Try searching for a different reference number or name."
                    : "There are currently no tickets matching this status."
                }
                className="py-20 border rounded-md bg-muted/10"
              />
            ) : (
              <>
                <div className="border border-muted rounded-lg shadow-sm overflow-x-auto w-full">
                  <table className="table-fixed w-full min-w-[820px] divide-y divide-muted">
                    <colgroup>
                      {TICKET_TABLE_COLUMNS.map(({ key, width }) => (
                        <col key={key} style={{ width }} />
                      ))}
                    </colgroup>
                    <thead className="bg-muted/50">
                      <tr>
                        {TICKET_TABLE_COLUMNS.map(({ key, label }) => (
                          <th key={key} className="h-11 px-6 py-3 text-left text-xs font-medium uppercase">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {tickets.map((ticket) => (
                        <TicketsTableRow
                          key={ticket.id}
                          ticket={ticket}
                          projectId={projectId}
                          agents={agents}
                          canEditAnyTicket={canEditAnyTicket}
                          memberId={memberId}
                          onOpenTicket={() => {
                            markAsRead(ticket.id);
                            navigate({
                              search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                            });
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
              </>
            )}
          </div>
        )
      ) : (
        <div className="space-y-8">
          <div className="flex flex-row justify-between items-end gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and resolve customer support tickets for this project.
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-4 w-full">
            <div className="w-64 shrink-0">
              <input
                type="text"
                placeholder="Search..."
                className="p-2 border rounded-md min-w-64"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-auto">
              {filterTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  onClick={() =>
                    navigate({
                      search: (prev) => ({ ...prev, statusFilter: tab.value }),
                    })
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-sm whitespace-nowrap ${
                    statusFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {tab.label} ({getCount(tab.value)})
                </button>
              ))}
              <TicketSortSelect
                sort={sort}
                onSortChange={(nextSort) =>
                  navigate({
                    search: (prev) => ({ ...prev, sort: nextSort }),
                    replace: true,
                  })
                }
              />
            </div>
          </div>

          {total === 0 ? (
            <EmptyState
              icon={<X className="size-10" strokeWidth={1} />}
              title={searchQuery ? "Reference doesn't match" : `No ${statusFilter.toLowerCase()} tickets found`}
              description={
                searchQuery
                  ? "Try searching for a different reference number or name."
                  : "There are currently no tickets matching this status."
              }
              className="py-20 border rounded-md bg-muted/10"
            />
          ) : (
            <>
              <div className="border border-muted rounded-lg shadow-sm overflow-x-auto w-full">
                <table className="table-fixed w-full divide-y divide-muted">
                  <colgroup>
                    {TICKET_TABLE_COLUMNS.map(({ key, width }) => (
                      <col key={key} style={{ width }} />
                    ))}
                  </colgroup>
                  <thead className="bg-muted/50">
                    <tr>
                      {TICKET_TABLE_COLUMNS.map(({ key, label }) => (
                        <th key={key} className="h-11 px-6 py-3 text-left text-xs font-medium uppercase">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {tickets.map((ticket) => (
                      <TicketsTableRow
                        key={ticket.id}
                        ticket={ticket}
                        projectId={projectId}
                        agents={agents}
                        canEditAnyTicket={canEditAnyTicket}
                        memberId={memberId}
                        onOpenTicket={() => {
                          markAsRead(ticket.id);
                          navigate({
                            search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                          });
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </>
          )}

          <TicketDetailPanel
            projectId={projectId}
            organizationId={organizationId}
            ticketId={selectedTicketId}
            onClose={clearSelection}
            memberId={memberId}
            canEditAnyTicket={canEditAnyTicket}
          />
        </div>
      )}
    </div>
  );
}
