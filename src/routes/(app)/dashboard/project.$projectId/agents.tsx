import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  MoreVertical,
  Search,
  Users,
  X,
} from "lucide-react";
import type { Member, User } from "prisma/generated/client";
import { Suspense, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTableSkeleton, TextSkeleton } from "@/components/ui/skeleton";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { projectCustomerQueries } from "@/modules/customer/customer.queries";
import { memberQueries } from "@/modules/members/member.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/agents")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(memberQueries.agentAllByOrgId(context.project.organizationId));
  },
  component: ProjectAgentsPage,
});

function ProjectAgentsPage() {
  const { project } = Route.useRouteContext();
  const { projectId } = Route.useParams();

  return (
    <div className="flex h-screen w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto p-4 md:p-10 space-y-10 overflow-hidden">
            <TextSkeleton lines={1} />
            <DataTableSkeleton />
          </div>
        }
      >
        <AgentTable organizationId={project.organizationId} projectId={projectId} />
      </Suspense>
    </div>
  );
}

function AgentTable({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  // Fetch Agents
  const agentsQuery = useSuspenseQuery(memberQueries.agentAllByOrgId(organizationId));
  const allMembers = (agentsQuery.data ?? []) as Array<Member & { user: User }>;
  const members = allMembers.filter((m) => hasOrgRole(m.role, ORG_ROLE.AGENT));

  // Fetch Real Customers/Tickets for the Project
  const customersQuery = useQuery(projectCustomerQueries.allByProjectId(projectId));

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Derived Data
  const selectedAgent = members.find((m) => m.id === selectedAgentId) ?? null;

  // --- FILTER FIX APPLIED HERE ---
  const filteredMembers = members.filter((m) => {
    const safeSearch = searchQuery.toLowerCase();

    // 1. Safe Search: Explicitly allow through if search is empty, otherwise safely check name/email
    const matchesSearch =
      !safeSearch ||
      (m.user?.name?.toLowerCase().includes(safeSearch) ?? false) ||
      (m.user?.email?.toLowerCase().includes(safeSearch) ?? false);

    // 2. Safe Role: Fallback to "AGENT" if role is null, and convert both to uppercase for comparison
    const memberRole = (m.role || "AGENT").toUpperCase();
    const matchesRole = roleFilter === "ALL" || memberRole === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  // Calculate Real Agent Metrics & Conversations
  const agentStats = useMemo(() => {
    if (!selectedAgent?.user?.id || !customersQuery.data) {
      return { handledChats: [], messagesSentCount: 0 };
    }

    const targetUserId = selectedAgent.user.id;
    let messagesSentCount = 0;
    const handledChats: Array<{
      id: string;
      customerName: string;
      status: string;
      lastMessage: string;
    }> = [];

    customersQuery.data.forEach((customer) => {
      customer.tickets.forEach((ticket) => {
        const agentMessages = ticket.ticketMessages.filter((msg) => msg.userId === targetUserId);

        if (agentMessages.length > 0) {
          messagesSentCount += agentMessages.length;
          handledChats.push({
            id: ticket.id,
            customerName: customer.name,
            status: ticket.status,
            lastMessage: ticket.ticketMessages[ticket.ticketMessages.length - 1]?.content || "No message content",
          });
        }
      });
    });

    return { handledChats, messagesSentCount };
  }, [selectedAgent, customersQuery.data]);

  // Helper for specific Badge colors
  const getRoleBadgeColors = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      default:
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
    }
  };

  return (
    <div className="flex flex-1 w-full relative overflow-hidden">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col w-full h-full p-4 md:p-8 overflow-y-auto">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your support team and view their performance.</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="relative md:block">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-background border border-input rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="AGENT">Agent</option>
              </select>
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-background rounded-[12px] border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 md:px-6 py-4 rounded-tl-[12px]">User</th>
                  <th className="px-4 md:px-6 py-4">Email</th>
                  <th className="px-4 md:px-6 py-4">Role</th>
                  <th className="px-4 md:px-6 py-4">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right rounded-tr-[12px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((m) => {
                  const initial = (m.user?.name || m.user?.email || "?").charAt(0).toUpperCase();
                  const isActive = true; // Mocked active status

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedAgentId(m.id)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm shrink-0">
                            {initial}
                          </div>
                          <span className="font-medium text-foreground">{m.user?.name ?? "Unknown User"}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {m.user?.email ?? "-"}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={`uppercase tracking-wider text-[10px] ${getRoleBadgeColors(m.role || "AGENT")}`}
                        >
                          {m.role ?? "AGENT"}
                        </Badge>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-muted-foreground">
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-muted md:opacity-0 md:group-hover:opacity-100 transition-all focus:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground px-4">
                        <Users className="w-10 h-10 opacity-20 mb-3" />
                        <p className="text-sm font-medium">No agents found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* DRILL-DOWN VIEW DRAWER */}
      {selectedAgentId && (
        <button
          type="button"
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedAgentId(null)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          selectedAgentId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedAgent && (
          <>
            <header className="p-4 md:p-6 border-b border-border flex items-start justify-between bg-muted/20">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg md:text-xl font-bold shadow-sm shrink-0 border border-primary/20">
                  {(selectedAgent.user?.name || selectedAgent.user?.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-foreground truncate">
                    {selectedAgent.user?.name ?? "Unknown User"}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 md:mt-1 flex-wrap">
                    <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                      {selectedAgent.user?.email}
                    </span>
                    <span className="text-muted-foreground/40 hidden sm:inline">•</span>

                    <Badge
                      className={`text-[9px] uppercase tracking-wider shrink-0 px-2 py-0.5 ${getRoleBadgeColors(selectedAgent.role || "AGENT")}`}
                    >
                      {selectedAgent.role ?? "AGENT"}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgentId(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
              <div>
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="p-3 md:p-4 rounded-[10px] bg-muted/40 border border-border flex flex-col items-center text-center">
                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-500 mb-1.5 md:mb-2 opacity-80" />
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      {agentStats.handledChats.length}
                    </span>
                    <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mt-1">
                      Chats Handled
                    </span>
                  </div>
                  <div className="p-3 md:p-4 rounded-[10px] bg-muted/40 border border-border flex flex-col items-center text-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 mb-1.5 md:mb-2 opacity-80" />
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      {agentStats.messagesSentCount}
                    </span>
                    <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mt-1">
                      Messages Sent
                    </span>
                  </div>
                  {/* static for now  */}
                  <div className="p-3 md:p-4 rounded-[10px] bg-muted/40 border border-border flex flex-col items-center text-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 mb-1.5 md:mb-2 opacity-80" />
                    <span className="text-xl md:text-2xl font-bold text-foreground">2m 14s</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mt-1">
                      Avg Response
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                  Recent Conversations
                </h3>
                <div className="space-y-3">
                  {customersQuery.isLoading ? (
                    <div className="flex justify-center p-6">
                      <span className="text-sm text-muted-foreground animate-pulse">Loading conversations...</span>
                    </div>
                  ) : agentStats.handledChats.length === 0 ? (
                    <div className="flex flex-col items-center text-center border border-dashed border-border p-6 rounded-[10px] bg-muted/20">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No recent conversations.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        This agent hasn't replied to any tickets yet.
                      </p>
                    </div>
                  ) : (
                    agentStats.handledChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-3 md:p-4 rounded-[12px] bg-background border border-border hover:border-primary/30 transition-colors shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">{chat.customerName}</h4>
                            <p className="text-xs text-muted-foreground truncate mt-0.5 pr-2">"{chat.lastMessage}"</p>
                          </div>
                          {chat.status === "OPEN" ? (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-[4px] shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-[4px] shrink-0">
                              <Archive className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase">Closed</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-border/50">
                          <button
                            type="button"
                            className="text-[10px] md:text-xs font-medium text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/50 px-3 py-1.5 rounded-[6px] transition-colors"
                          >
                            View Transcript
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
