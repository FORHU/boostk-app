import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

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

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/tickets")({
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

// Chat Bubble Component
function TicketChatMessageBubble({ message, isCustomer }: { message: string; isCustomer: boolean }) {
  return (
    <div className={`flex w-full mb-4 ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] p-3 shadow-sm overflow-hidden ${
          isCustomer ? "bg-background rounded-[16px] rounded-tl-none" : "bg-primary rounded-[16px] rounded-tr-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
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
  const { data: ticket, isLoading } = useQuery({
    ...projectTicketQueries.detailById(projectId, ticketId || ""),
    enabled: !!ticketId,
  });

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-background dark:bg-muted h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isLoading ? "Loading..." : ticket?.customer?.name || "Customer Ticket"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
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
      </div>
    </div>
  );
}

// Main Page Component
function ProjectTicketsPage() {
  const { projectId } = Route.useParams();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
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
    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "Closed", value: "CLOSED" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and resolve customer support tickets for this project.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <input
          type="text"
          placeholder="Search..."
          className="p-2 border rounded-[5px] min-w-62.5"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex items-center gap-2">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
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
        <div className="border border-muted rounded-[7px] shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                {["referenceNumber", "status", "customerName", "createdAt"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer"
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
                  className="hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.referenceNumber}</td>
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

      <TicketDetailPanel projectId={projectId} ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
    </div>
  );
}
