import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Loader2, Maximize, Minimize, Send, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { TicketPriorityBadge, TicketPrioritySelect, type TicketPriorityType } from "@/components/ui/ticket-priority";
import { useToast } from "@/components/ui/toast";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { createAgentTicketMessageFn } from "@/modules/ticket-message/ticket-message.functions";

// 1. Fetching Function. Agent-only.
export const getProjectTicketsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.ticket.findMany({
      where: { projectId: data.projectId },
      include: { customer: true },
      // `as const` pins the literal so Prisma's orderBy doesn't widen to `string`,
      // which otherwise collapses the `include` payload type and drops `customer`.
      orderBy: { createdAt: "desc" as const },
    });
  });

export const getTicketByIdFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string(), ticketId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.ticket.findUnique({
      where: { id: data.ticketId, projectId: data.projectId },
      include: {
        customer: true,
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
    return prisma.ticket.update({
      where: {
        id: data.ticketId,
        projectId: data.projectId,
      },
      data: { status: data.status },
    });
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

// 2. Query Options
export const projectTicketQueries = {
  tickets: ["project-tickets"],
  allByProjectId: (projectId: string) =>
    queryOptions({
      queryKey: [...projectTicketQueries.tickets, "all", projectId],
      queryFn: () => getProjectTicketsFn({ data: { projectId } }),
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
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    </div>
  );
}

// 4. URL Search Schema validation
const ticketSearchSchema = z.object({
  selectedTicketId: z.string().optional().catch(undefined),
  statusFilter: z.string().default("ALL").catch("ALL"),
  searchQuery: z.string().optional().catch(undefined),
  sortBy: z.string().optional().catch(undefined),
  sortDir: z.enum(["asc", "desc"]).optional().catch(undefined),
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

export function PanelReplyInput({
  projectId,
  ticketId,
  language,
}: {
  projectId: string;
  ticketId: string;
  language?: string | null;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const replyMutation = useMutation({
    mutationFn: createAgentTicketMessageFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId).queryKey,
      });
    },
    onError: () => {
      toast("Failed to send message. Please try again.", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    replyMutation.mutate({
      data: { content: trimmed, contentType: "TEXT", ticketId: ticketId },
    });
    setMessage("");
  };

  const placeholder = language
    ? `Reply in your language — the customer reads it in ${language}`
    : "Reply to the customer...";

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border bg-background">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={replyMutation.isPending}
        className="flex-1 bg-muted rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!message.trim() || replyMutation.isPending}
        className="bg-primary text-primary-foreground p-2.5 rounded-xl active:scale-95 disabled:opacity-50"
      >
        <Send size={18} />
      </button>
    </form>
  );
}

// Chat Bubble Component
function TicketChatMessageBubble({ message, isCustomer }: { message: string; isCustomer: boolean }) {
  return (
    <div className={`flex w-full mb-4 ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`w-fit max-w-[85%] sm:max-w-112.5 md:max-w-150 p-3 shadow-sm overflow-hidden wrap-break-words ${
          isCustomer
            ? "bg-background rounded-[16px] rounded-tl-none border border-border/50"
            : "bg-primary text-primary-foreground rounded-[16px] rounded-tr-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap wrap-break-words">{message}</p>
      </div>
    </div>
  );
}

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
  ticketId,
  onClose,
}: {
  projectId: string;
  ticketId: string | null;
  onClose: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const { data: ticket, isLoading } = useQuery({
    ...projectTicketQueries.detailById(projectId, ticketId || ""),
    enabled: !!ticketId,
  });

  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: updateTicketStatusFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.allByProjectId(projectId).queryKey,
      });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: updateTicketPriorityFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.detailById(projectId, ticketId || "").queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: projectTicketQueries.allByProjectId(projectId).queryKey,
      });
    },
    onError: () => toast("Failed to update priority."),
  });

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity">
      <div
        className={`bg-background dark:bg-muted h-full flex flex-col animate-in slide-in-from-right duration-300 transition-all ease-in-out w-full ${
          isExpanded ? "max-w-full" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {isLoading ? "Loading..." : ticket?.customer?.name || "Customer Ticket"}
            </h2>
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
              className="px-3 py-1.5 text-xs font-medium rounded-[4px] bg-muted hover:bg-muted/80 disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : ticket?.status === "OPEN" ? (
                "Close Ticket"
              ) : (
                "Reopen Ticket"
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              title={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              {isExpanded ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              title="Close panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : !ticket?.ticketMessages || ticket.ticketMessages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-10">No messages found.</div>
          ) : (
            <div className="flex flex-col">
              {ticket.ticketMessages.map((msg) => (
                <TicketChatMessageBubble key={msg.id} message={msg.content} isCustomer={msg.customerId != null} />
              ))}
            </div>
          )}
        </div>

        {!isLoading && ticket && (
          <PanelReplyInput projectId={projectId} ticketId={ticketId} language={ticket.customer?.language} />
        )}
      </div>
    </div>
  );
}

// Main Page Component
function ProjectTicketsPage() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const selectedTicketId = search.selectedTicketId ?? null;
  const statusFilter = search.statusFilter;
  const searchQuery = search.searchQuery ?? "";
  const sortConfig = search.sortBy && search.sortDir ? { key: search.sortBy, direction: search.sortDir } : null;

  const { data: tickets } = useSuspenseQuery(projectTicketQueries.allByProjectId(projectId));

  const getCount = (status: string) =>
    status === "ALL" ? tickets.length : tickets.filter((t) => t.status === status).length;

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
    const matchesSearch =
      ticket.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortConfig) return 0;
    let aValue = a[sortConfig.key as keyof typeof a];
    let bValue = b[sortConfig.key as keyof typeof b];

    if (sortConfig.key === "customerName") {
      aValue = a.customer?.name ?? "";
      bValue = b.customer?.name ?? "";
    }
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    navigate({
      search: (prev) => {
        const isCurrent = prev.sortBy === key;
        const newDir = isCurrent && prev.sortDir === "desc" ? "asc" : "desc";
        return {
          ...prev,
          sortBy: key,
          sortDir: newDir,
        };
      },
    });
  };

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "Closed", value: "CLOSED" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and resolve customer support tickets for this project.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
        <div className="w-full md:w-64 shrink-0">
          <input
            type="text"
            placeholder="Search..."
            className="p-2 border rounded-[5px] min-w-[250px]"
            value={searchQuery}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  searchQuery: e.target.value || undefined, // Cleans the URL if the string is empty
                }),
                replace: true, // Prevents blowing up browser history stack on every keystroke
              })
            }
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab.value}
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, statusFilter: tab.value }),
                })
              }
              className={`px-4 py-2 text-sm font-medium rounded-[3px] whitespace-nowrap ${
                statusFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {tab.label} ({getCount(tab.value)})
            </button>
          ))}
        </div>
      </div>

      {sortedTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-[5px] bg-muted/10">
          <div className="text-muted-foreground mb-2">
            <X size={40} strokeWidth={1} />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {searchQuery ? "Reference doesn't match" : `No ${statusFilter.toLowerCase()} tickets found`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "Try searching for a different reference number or name."
              : "There are currently no tickets matching this status."}
          </p>
        </div>
      ) : (
        <div className="border border-muted rounded-[7px] shadow-sm overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {["referenceNumber", "priority", "status", "customerName", "createdAt"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    {col === "customerName" ? "Customer Name" : col.replace(/([A-Z])/g, " $1")}
                    {sortConfig?.key === col ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {sortedTickets.map((ticket) => (
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
                    // Listen for both Enter and Space keys
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
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TicketDetailPanel
        projectId={projectId}
        ticketId={selectedTicketId}
        onClose={() =>
          navigate({
            search: (prev) => ({ ...prev, selectedTicketId: undefined }),
          })
        }
      />
    </div>
  );
}
