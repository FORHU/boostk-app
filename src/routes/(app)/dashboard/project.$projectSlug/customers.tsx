import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Filter,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Star,
  Tag,
  Ticket as TicketIcon,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTableSkeleton, TextSkeleton, ToolbarSkeleton, UsageCardsSkeleton } from "@/components/ui/skeleton";
import { TicketPriorityBadge } from "@/components/ui/ticket-priority";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate, formatRelative } from "@/lib/format-date";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { projectCustomerQueries } from "@/modules/customer/customer.queries";
import type { ProjectCustomerSummary } from "@/modules/customer/customer.schema";

type StatusFilter = "ALL" | "ACTIVE" | "CLOSED" | "NONE";

const matchesStatus = (customer: ProjectCustomerSummary, statusFilter: StatusFilter) => {
  switch (statusFilter) {
    case "ACTIVE":
      return customer.openTickets > 0;
    case "CLOSED":
      return customer.totalTickets > 0 && customer.openTickets === 0;
    case "NONE":
      return customer.totalTickets === 0;
    default:
      return true;
  }
};

const customerSearchSchema = z.object({
  page: z.number().int().min(1).optional().catch(1),
});

function CustomersLoadingFallback() {
  return (
    <div className="flex h-full w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      <main className="flex-1 flex flex-col w-full h-full p-4 md:p-8 overflow-y-auto">
        <TextSkeleton lines={1} className="max-w-sm" />
        <div className="mt-6 md:mt-8">
          <UsageCardsSkeleton count={4} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
        </div>
        <div className="mt-6 md:mt-8 space-y-6">
          <ToolbarSkeleton />
          <DataTableSkeleton columnCount={7} rowCount={6} />
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/(app)/dashboard/project/$projectSlug/customers")({
  validateSearch: (search) => customerSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({
        to: "/dashboard/organizations",
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED },
      });
    }
  },
  pendingComponent: CustomersLoadingFallback,
  component: ProjectCustomersPage,
});

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
        {icon}
      </div>
      <div>
        <p className="text-3xl md:text-4xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-3 md:p-4 rounded-[10px] bg-muted/40 border border-border flex flex-col items-center text-center">
      <span className="text-blue-500 mb-1.5 md:mb-2 opacity-80">{icon}</span>
      <span className="text-lg md:text-xl font-bold text-foreground">{value}</span>
      <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase font-bold text-muted-foreground truncate">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "OPEN" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      Closed
    </span>
  );
}

function CustomerPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function ProjectCustomersPage() {
  const { project } = Route.useRouteContext();
  const projectId = project.id;
  const projectSlug = project.slug;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = search.page ?? 1;

  const customersQuery = useQuery({
    ...projectCustomerQueries.list({ projectId, search: debouncedSearchQuery, page }),
    placeholderData: (prev) => prev,
  });
  const customers = customersQuery.data?.customers ?? [];
  const totalPages = customersQuery.data?.totalPages ?? 1;

  const statsQuery = useQuery(projectCustomerQueries.stats(projectId));
  const stats = statsQuery.data;

  // Full customer (contact + tickets + messages) fetched only for the drawer.
  const threadQuery = useQuery({
    ...projectCustomerQueries.thread(projectId, selectedCustomerId ?? ""),
    enabled: !!selectedCustomerId,
  });
  const activeCustomer = threadQuery.data && threadQuery.data.id === selectedCustomerId ? threadQuery.data : null;

  const filteredCustomers = customers.filter((customer) => matchesStatus(customer, statusFilter));

  const prevSearchRef = useRef(debouncedSearchQuery);

  // Reset to page 1 when the search actually changes (skip the initial mount).
  useEffect(() => {
    if (prevSearchRef.current === debouncedSearchQuery) return;
    prevSearchRef.current = debouncedSearchQuery;
    navigate({ search: (prev) => ({ ...prev, page: 1 }), replace: true });
  }, [debouncedSearchQuery, navigate]);

  // Clamp the page when the dataset shrinks (e.g. search narrows on the last page).
  useEffect(() => {
    if (customersQuery.isSuccess && page > totalPages) {
      navigate({ search: (prev) => ({ ...prev, page: totalPages }), replace: true });
    }
  }, [customersQuery.isSuccess, page, totalPages, navigate]);

  const goToPage = (nextPage: number) => navigate({ search: (prev) => ({ ...prev, page: nextPage }), replace: true });

  if (customersQuery.isPending && customers.length === 0) {
    return <CustomersLoadingFallback />;
  }

  const totalTickets = activeCustomer?.tickets.length ?? 0;
  const openTickets = activeCustomer?.tickets.filter((ticket) => ticket.status === "OPEN").length ?? 0;
  const ratedTickets = activeCustomer?.tickets.filter((ticket) => ticket.satisfactionScore != null) ?? [];
  const averageSatisfaction =
    ratedTickets.length > 0
      ? ratedTickets.reduce((sum, ticket) => sum + (ticket.satisfactionScore ?? 0), 0) / ratedTickets.length
      : null;

  return (
    <div className="flex h-full w-full bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col w-full h-full p-4 md:p-8 overflow-y-auto">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">View your customers and their support activity.</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="relative md:block">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none pl-9 pr-8 py-2 bg-background border border-input rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Customers</option>
                <option value="ACTIVE">With Open Tickets</option>
                <option value="CLOSED">Closed Tickets</option>
                <option value="NONE">No Tickets</option>
              </select>
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Customers"
            value={stats ? String(stats.totalCustomers) : "—"}
            sub="Total in this project"
            icon={<Users className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />}
          />
          <StatCard
            label="Open Tickets"
            value={stats ? String(stats.openTickets) : "—"}
            sub="Require attention"
            icon={<CircleDot className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />}
          />
          <StatCard
            label="New This Month"
            value={stats ? String(stats.newThisMonth) : "—"}
            sub="Customers added"
            icon={<TrendingUp className="w-5 h-5 text-blue-500" strokeWidth={1.5} />}
          />
          <StatCard
            label="Avg Rating"
            value={stats?.averageSatisfaction != null ? stats.averageSatisfaction.toFixed(1) : "—"}
            sub="CSAT out of 5"
            icon={<Star className="w-5 h-5 text-amber-500" strokeWidth={1.5} />}
          />
        </div>

        {/* Data Table */}
        <div className="bg-background rounded-[12px] border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-4 md:px-6 py-4 rounded-tl-[12px]">Customer</th>
                  <th className="px-4 md:px-6 py-4">Email</th>
                  <th className="px-4 md:px-6 py-4">Phone</th>
                  <th className="px-4 md:px-6 py-4">Language</th>
                  <th className="px-4 md:px-6 py-4">Tickets</th>
                  <th className="px-4 md:px-6 py-4">Rating</th>
                  <th className="px-4 md:px-6 py-4 rounded-tr-[12px]">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((customer) => {
                  const initial = (customer.name || customer.email || "?").charAt(0).toUpperCase();
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{customer.name}</p>
                            {customer.metadata ? (
                              <p className="text-xs text-muted-foreground truncate">{customer.metadata}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-muted-foreground">{customer.email}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {customer.phone ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {customer.language ?? "—"}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {customer.openTickets > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                              <CircleDot className="w-3 h-3" />
                              {customer.openTickets} open
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">{customer.totalTickets} total</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        {customer.averageSatisfaction != null ? (
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{customer.averageSatisfaction.toFixed(1)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatRelative(customer.updatedAt)}
                      </td>
                    </tr>
                  );
                })}

                {filteredCustomers.length === 0 && !customersQuery.isPending && (
                  <tr>
                    <td colSpan={7} className="text-center">
                      <EmptyState
                        icon={<Users className="w-10 h-10 opacity-20" />}
                        title="No customers found"
                        description="Try adjusting your search or filters."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CustomerPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      </main>

      {/* DRILL-DOWN DETAIL DRAWER */}
      {selectedCustomerId && (
        <button
          type="button"
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedCustomerId(null)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          selectedCustomerId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {activeCustomer ? (
          <>
            <header className="p-4 md:p-6 border-b border-border flex items-start justify-between bg-muted/20">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg md:text-xl font-bold shadow-sm shrink-0 border border-primary/20">
                  {(activeCustomer.name || activeCustomer.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-foreground truncate">{activeCustomer.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 md:mt-1 flex-wrap">
                    <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[160px] md:max-w-[240px]">
                      {activeCustomer.email}
                    </span>
                    {activeCustomer.language && (
                      <Badge className="text-[9px] uppercase tracking-wider shrink-0 px-2 py-0.5 bg-muted text-muted-foreground border-border">
                        {activeCustomer.language}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
              <Link
                to="/dashboard/project/$projectSlug/chat-support"
                params={{ projectSlug }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[8px] border border-primary/20 text-primary hover:bg-primary/5 text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                View in Chat Support
              </Link>

              <div>
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                  Customer Stats
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <MiniStat
                    icon={<TicketIcon className="w-4 h-4 md:w-5 md:h-5" />}
                    value={String(totalTickets)}
                    label="Total Tickets"
                  />
                  <MiniStat
                    icon={<CircleDot className="w-4 h-4 md:w-5 md:h-5" />}
                    value={String(openTickets)}
                    label="Open Tickets"
                  />
                  <MiniStat
                    icon={<Star className="w-4 h-4 md:w-5 md:h-5" />}
                    value={averageSatisfaction != null ? averageSatisfaction.toFixed(1) : "—"}
                    label="Avg Rating"
                  />
                  <MiniStat
                    icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />}
                    value={formatRelative(activeCustomer.updatedAt)}
                    label="Last Activity"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                  Contact
                </h3>
                <ul className="space-y-3">
                  <ContactRow icon={<Mail className="w-4 h-4" />} label="Email" value={activeCustomer.email} />
                  <ContactRow icon={<Phone className="w-4 h-4" />} label="Phone" value={activeCustomer.phone ?? "—"} />
                  <ContactRow
                    icon={<Globe className="w-4 h-4" />}
                    label="Language"
                    value={activeCustomer.language ?? "—"}
                  />
                  {activeCustomer.metadata ? (
                    <ContactRow icon={<Tag className="w-4 h-4" />} label="Source" value={activeCustomer.metadata} />
                  ) : null}
                  <ContactRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Customer Since"
                    value={formatDate(activeCustomer.createdAt)}
                  />
                </ul>
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                  Ticket History
                </h3>
                {activeCustomer.tickets.length === 0 ? (
                  <div className="flex flex-col items-center text-center border border-dashed border-border p-6 rounded-[10px] bg-muted/20">
                    <TicketIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No tickets yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCustomer.tickets.map((ticket) => {
                      const messageCount = ticket.ticketMessages.length;
                      const lastMessage = ticket.ticketMessages[messageCount - 1]?.content;
                      return (
                        <div
                          key={ticket.id}
                          className="p-3 md:p-4 rounded-[12px] bg-background border border-border shadow-sm flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{ticket.referenceNumber}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(ticket.updatedAt)}</p>
                            </div>
                            <TicketPriorityBadge priority={ticket.priority} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <StatusBadge status={ticket.status} />
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {ticket.satisfactionScore != null && (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {ticket.satisfactionScore}/5
                                </span>
                              )}
                              <span>
                                {messageCount} {messageCount === 1 ? "message" : "messages"}
                              </span>
                            </div>
                          </div>
                          {lastMessage && <p className="text-xs text-muted-foreground truncate">"{lastMessage}"</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : selectedCustomerId ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </aside>
    </div>
  );
}
