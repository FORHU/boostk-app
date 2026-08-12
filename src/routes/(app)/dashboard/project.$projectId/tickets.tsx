import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Loader2, Maximize, MessageCircle, Minimize, User, X } from "lucide-react";
import type { TicketMessage } from "prisma/generated/client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ReplyInput } from "@/components/chat-support/reply-input";
import TicketChatMessageBubble from "@/components/chat-support/TicketChatMessageBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketPriorityBadge, TicketPrioritySelect, type TicketPriorityType } from "@/components/ui/ticket-priority";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { useSocket } from "@/hooks/use-socket";
import { useViewport } from "@/hooks/use-viewport";
import { formatRelative } from "@/lib/format-date";
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
  .handler(async ({ data }) => {
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
  .handler(async ({ data }) => {
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
  .handler(async ({ data }) => {
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
  // Not wrapped in queryOptions: `list` feeds `useInfiniteQuery`, and this version
  // of queryOptions only models regular useQuery options.
  list: (projectId: string, sort: TicketSort) => ({
    queryKey: [...projectTicketQueries.listPrefix(projectId), "list", sort],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getProjectTicketsFn({ data: { projectId, cursor: pageParam, sort } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: Awaited<ReturnType<typeof getProjectTicketsFn>>) => lastPage.nextCursor,
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

// 3. Loading Fallback(spinner)
function TicketsLoadingFallback() {
  return (
    <div className="p-6 flex flex-col min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary size-8" />
      </div>
    </div>
  );
}

// 4. URL Search Schema validation
const ticketSearchSchema = z.object({
  selectedTicketId: z.string().optional().catch(undefined),
  statusFilter: z.string().default("ALL").catch("ALL"),
  searchQuery: z.string().optional().catch(undefined),
  sort: z.enum(TICKET_SORT_OPTIONS).default("newest"),
});

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/tickets")({
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

// Chat Bubble Grouping Helper
const isSameGroup = (m1?: TicketMessage, m2?: TicketMessage) => {
  if (!m1 || !m2) return false;
  if (m1.userId !== m2.userId) return false;
  if (m1.customerId !== m2.customerId) return false;
  return Math.abs(new Date(m2.createdAt).getTime() - new Date(m1.createdAt).getTime()) <= 30000;
};

function getStatusBadgeClasses(status: string) {
  switch (status.toUpperCase()) {
    case "OPEN":
      return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
    case "CLOSED":
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TicketDetailPanel({
  projectId,
  organizationId,
  ticketId,
  onClose,
  onBack,
}: {
  projectId: string;
  organizationId: string;
  ticketId: string | null;
  onClose: () => void;
  onBack?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const { data: ticket, isLoading } = useQuery({
    ...projectTicketQueries.detailById(projectId, ticketId || ""),
    enabled: !!ticketId,
  });

  const queryClient = useQueryClient();

  const agentsQuery = useQuery({
    ...memberQueries.agentAllByOrgId(organizationId),
    enabled: !!organizationId,
  });
  const agents = (agentsQuery.data ?? []).filter((member) => hasOrgRole(member.role, ORG_ROLE.AGENT));

  const assignMutation = useMutation({
    mutationFn: assignTicketFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update assignee."),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update status."),
  });

  const updatePriorityMutation = useMutation({
    mutationFn: updateTicketPriorityFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.listPrefix(projectId),
      });
    },
    onError: () => toast("Failed to update priority."),
  });

  if (!ticketId) return null;

  return (
    <div
      className={
        onBack
          ? "h-full flex flex-col"
          : "fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity"
      }
    >
      <div
        className={`bg-background dark:bg-muted h-full flex flex-col w-full ${
          onBack ? "" : "animate-in slide-in-from-right duration-300 transition-all ease-in-out max-w-lg"
        } ${isExpanded ? "max-w-full" : ""}`}
      >
        <header className="flex-none bg-blue-600 dark:bg-blue-800 p-4 text-white flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 -ml-1 text-blue-100 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            {/* Identifies the customer on the other end, not BOOSTK — person icon. */}
            <div className="bg-blue-400/30 p-2 rounded-lg">
              <User size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold leading-none">
                {isLoading ? "Loading..." : ticket?.customer?.name || "Customer Ticket"}
              </h2>
              <span className="text-[10px] text-blue-200 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    ticket?.status === "OPEN" ? "bg-green-400" : "bg-gray-400"
                  }`}
                ></span>
                {ticket?.status === "OPEN" ? "Open" : "Closed"}
              </span>
              {!isLoading && ticket && (
                <TicketPrioritySelect
                  priority={ticket.priority}
                  isPending={updatePriorityMutation.isPending}
                  onPriorityChange={(newPriority: TicketPriorityType) => {
                    updatePriorityMutation.mutate({
                      data: { projectId, ticketId, priority: newPriority },
                    });
                  }}
                />
              )}
              {!isLoading && ticket && (
                <div className="flex items-center gap-2">
                  <select
                    value={ticket.assignedAgentId ?? ""}
                    disabled={assignMutation.isPending}
                    onChange={(e) => {
                      assignMutation.mutate({
                        data: {
                          projectId,
                          ticketId,
                          assignedAgentId: e.target.value || null,
                        },
                      });
                    }}
                    className="text-xs bg-white/10 text-white rounded-[4px] px-2 py-1 outline-none border border-transparent focus:border-white/50 focus:ring-1 focus:ring-white/50 disabled:opacity-50 cursor-pointer"
                    title="Assign this ticket to an agent"
                  >
                    <option value="" style={{ color: "black", backgroundColor: "white" }}>
                      Unassigned
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} style={{ color: "black", backgroundColor: "white" }}>
                        {agent.user?.name || agent.user?.email}
                      </option>
                    ))}
                  </select>
                  {assignMutation.isPending && <Loader2 className="animate-spin text-blue-200" size={14} />}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (!ticketId) return;
                const newStatus = ticket?.status === "OPEN" ? "CLOSED" : "OPEN";
                updateStatusMutation.mutate({
                  data: {
                    projectId,
                    ticketId: ticketId,
                    status: newStatus,
                  },
                });
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-sm bg-white/15 hover:bg-white/25 disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="animate-spin size-3.5" />
              ) : ticket?.status === "OPEN" ? (
                "Close Ticket"
              ) : (
                "Reopen Ticket"
              )}
            </button>
            {!onBack && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
                  title={isExpanded ? "Collapse panel" : "Expand panel"}
                >
                  {isExpanded ? <Minimize className="size-[1.125rem]" /> : <Maximize className="size-[1.125rem]" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-colors"
                  title="Close panel"
                >
                  <X className="size-5" />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 scroll-smooth pb-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 size-6" />
            </div>
          ) : !ticket?.ticketMessages || ticket.ticketMessages.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <EmptyState
                icon={
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-full">
                    <MessageCircle className="text-blue-500 dark:text-blue-400" size={32} />
                  </div>
                }
                title="Waiting for the customer"
                description="Replies from the customer will appear here."
                className="h-full p-6"
              />
            </motion.div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {ticket.ticketMessages.map((msg, index, list) => {
                const isStart = !isSameGroup(list[index - 1], msg);
                const isEnd = !isSameGroup(msg, list[index + 1]);

                return (
                  <TicketChatMessageBubble key={msg.id} msg={msg} isStart={isStart} isEnd={isEnd} viewer="agent" />
                );
              })}
            </div>
          )}
        </div>
        {!isLoading && ticket && (
          <ReplyInput
            ticketId={ticketId}
            projectId={projectId}
            customerName={ticket.customer?.name}
            customerLanguage={ticket.customer?.language}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: projectTicketQueries.detailById(projectId, ticketId).queryKey,
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

// Main Page Component
function TicketSortSelect({ sort, onSortChange }: { sort: TicketSort; onSortChange: (sort: TicketSort) => void }) {
  const sortOptions: { label: string; value: TicketSort }[] = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Priority", value: "priority" },
  ];

  const activeLabel = sortOptions.find((o) => o.value === sort)?.label ?? "Newest first";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Sort tickets"
      >
        {activeLabel}
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)}>
            {option.label}
            {option.value === sort && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectTicketsPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { authSession, project } = Route.useRouteContext();
  const organizationId = project.organizationId;
  const queryClient = useQueryClient();
  const selectedTicketId = search.selectedTicketId ?? null;

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
  }, [lastMessage, selectedTicketId, projectId, queryClient]);

  const statusFilter = search.statusFilter.toUpperCase();
  const searchQuery = search.searchQuery ?? "";
  const sort = search.sort;

  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(inputValue);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery === searchQuery) return;
    navigate({
      search: (prev) => ({ ...prev, searchQuery: debouncedSearchQuery || undefined }),
      replace: true,
    });
  }, [debouncedSearchQuery, searchQuery, navigate]);

  const ticketsQuery = useInfiniteQuery({
    ...projectTicketQueries.list(projectId, sort),
    placeholderData: (prev) => prev,
  });
  const tickets = ticketsQuery.data?.pages.flatMap((page) => page.tickets) ?? [];
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = ticketsQuery;

  const { data: counts } = useSuspenseQuery(projectTicketQueries.counts(projectId));

  const getCount = (status: string) => {
    if (!counts) return 0;
    if (status === "ALL") return counts.total;
    if (status === "OPEN") return counts.open;
    if (status === "CLOSED") return counts.closed;
    return 0;
  };

  // Infinite scroll: fetch the next cursor page when the sentinel enters view.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { root: null, threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();

    if (!searchLower) return matchesStatus;

    const matchesSearch =
      (ticket.referenceNumber?.toLowerCase() || "").includes(searchLower) ||
      (ticket.customer?.name?.toLowerCase() || "").includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "Closed", value: "CLOSED" },
  ];

  const clearSelection = () =>
    navigate({
      search: (prev) => ({ ...prev, selectedTicketId: undefined }),
    });

  const { isMobile, isMounted } = useViewport();

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

            {filteredTickets.length === 0 ? (
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
                  <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50">
                      <tr>
                        {["referenceNumber", "priority", "status", "customerName", "assignee", "createdAt"].map(
                          (col) => (
                            <th key={col} className="px-6 py-3 text-left text-xs font-medium uppercase">
                              {col === "customerName" ? "Customer Name" : col.replace(/([A-Z])/g, " $1")}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          tabIndex={0}
                          className="hover:bg-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          onClick={() =>
                            navigate({
                              search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate({
                                search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                              });
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.referenceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TicketPriorityBadge priority={ticket.priority} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(ticket.status)}`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.customer?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {ticket.assignedAgent?.user?.name ?? (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatRelative(ticket.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasNextPage && (
                  <div ref={loadMoreRef} className="flex items-center justify-center py-2">
                    {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                )}
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

          {filteredTickets.length === 0 ? (
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
                <table className="min-w-full divide-y divide-muted">
                  <thead className="bg-muted/50">
                    <tr>
                      {["referenceNumber", "priority", "status", "customerName", "createdAt"].map((col) => (
                        <th key={col} className="px-6 py-3 text-left text-xs font-medium uppercase">
                          {col === "customerName" ? "Customer Name" : col.replace(/([A-Z])/g, " $1")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        tabIndex={0}
                        className="hover:bg-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        onClick={() =>
                          navigate({
                            search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate({
                              search: (prev) => ({ ...prev, selectedTicketId: ticket.id }),
                            });
                          }
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.referenceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TicketPriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.customer?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatRelative(ticket.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasNextPage && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-2">
                  {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              )}
            </>
          )}

          <TicketDetailPanel
            projectId={projectId}
            organizationId={organizationId}
            ticketId={selectedTicketId}
            onClose={clearSelection}
          />
        </div>
      )}
    </div>
  );
}
