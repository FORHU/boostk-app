import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleDot, ExternalLink, MessageSquarePlus, Settings, Ticket, Users } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { TextSkeleton, UsageCardsSkeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { TicketPriorityBadge } from "@/components/ui/ticket-priority";
import { formatRelative } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

type RecentTicketRow = {
  id: string;
  referenceNumber: string;
  status: "OPEN" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  createdAt: string | Date;
  customer: { name: string };
};

// 1. BACKEND: Server Function for Agent-Gated Data
export const getProjectOverviewFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data: { projectId } }) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [openTickets, closedTickets, customers, newTicketsThisWeek] = await prisma.$transaction([
      prisma.ticket.count({ where: { projectId, status: "OPEN" } }),
      prisma.ticket.count({ where: { projectId, status: "CLOSED" } }),
      prisma.customer.count({ where: { projectId } }),
      prisma.ticket.count({ where: { projectId, createdAt: { gte: weekAgo } } }),
    ]);

    const recentTickets = (await prisma.ticket.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    })) as unknown as RecentTicketRow[];

    const totalTickets = openTickets + closedTickets;
    const resolutionRate = totalTickets === 0 ? 0 : Math.round((closedTickets / totalTickets) * 100);

    return { openTickets, closedTickets, customers, newTicketsThisWeek, resolutionRate, recentTickets };
  });

// 2. QUERY OPTIONS
export const projectQueries = {
  project: ["project"],
  overview: (projectId: string) =>
    queryOptions({
      queryKey: [...projectQueries.project, projectId, "overview"],
      queryFn: () => getProjectOverviewFn({ data: { projectId } }),
    }),
};

// 3. ROUTE CONFIG
export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(projectQueries.overview(params.projectId));
  },
  component: ProjectOverviewPage,
});

// 4. FRONTEND COMPONENTS
function ProjectOverviewPage() {
  const { projectId } = Route.useParams();
  const { project } = Route.useRouteContext();

  return (
    <div className="w-full h-[calc(100dvh-64px)] overflow-y-auto bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 lg:space-y-8 pb-32">
        <div className="flex items-center gap-4">
          <EntityAvatar
            name={project.name}
            logo={project.logo}
            className="size-12"
            fallbackClassName="bg-primary/10 text-primary text-lg"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.description || "No description"} · /{project.slug}
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="space-y-10">
              <UsageCardsSkeleton className="space-y-0 p-0" />
              <TextSkeleton lines={5} className="max-w-full mt-8" />
            </div>
          }
        >
          <OverviewContent projectId={projectId} slug={project.slug} />
        </Suspense>
      </div>
    </div>
  );
}

function OverviewContent({ projectId, slug }: { projectId: string; slug: string }) {
  const query = useSuspenseQuery(projectQueries.overview(projectId));
  const { openTickets, closedTickets, customers, newTicketsThisWeek, resolutionRate, recentTickets } = query.data;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Open Tickets"
          value={openTickets}
          icon={<CircleDot className="size-5 text-emerald-500" strokeWidth={1.5} />}
          caption={`${newTicketsThisWeek} new in last 7 days`}
        />
        <StatCard
          title="Resolved"
          value={closedTickets}
          icon={<CheckCircle2 className="size-5 text-muted-foreground" strokeWidth={1.5} />}
          caption={`${resolutionRate}% resolution rate`}
        />
        <StatCard
          title="Customers"
          value={customers}
          icon={<Users className="size-5 text-muted-foreground" strokeWidth={1.5} />}
          caption="Active in this project"
          className="sm:col-span-2 md:col-span-1"
        />
      </div>

      {/* Recent Tickets & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-6 py-5 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Recent Tickets</h3>
            <Link
              to="/dashboard/project/$projectId/tickets"
              search={{ statusFilter: "ALL", sort: "newest" }}
              params={{ projectId }}
              className="text-sm text-primary hover:underline flex items-center"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.length === 0 ? (
              <EmptyState
                title="No tickets found for this project yet."
                size="sm"
                className="p-6"
                action={
                  <Link
                    to="/dashboard/project/$projectId/tickets"
                    params={{ projectId }}
                    search={{ statusFilter: "ALL", sort: "newest" }}
                    className="text-sm text-primary hover:underline"
                  >
                    View Tickets
                  </Link>
                }
              />
            ) : (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to="/dashboard/project/$projectId/tickets"
                  search={{ statusFilter: "ALL", sort: "newest" }}
                  params={{ projectId }}
                  className="flex items-center justify-between gap-3 p-4 md:px-6 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        #{ticket.referenceNumber}
                      </p>
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                          ticket.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {ticket.customer.name} · {formatRelative(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-2xl shadow-sm h-fit">
          <div className="px-4 md:px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
          </div>
          <div className="p-2">
            <Link
              to="/dashboard/project/$projectId/tickets"
              params={{ projectId }}
              search={{ statusFilter: "ALL", sort: "newest" }}
              className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <Ticket className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Manage Tickets
            </Link>
            <Link
              to="/dashboard/project/$projectId/customers"
              params={{ projectId }}
              className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <Users className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Customers
            </Link>
            <Link
              to="/dashboard/project/$projectId/settings"
              params={{ projectId }}
              className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <Settings className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Project Settings
            </Link>
            <a
              href={`/support/${slug}/chat-widget`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground mt-2 border-t border-border"
            >
              <MessageSquarePlus className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
              BoostK Chat
              <ExternalLink className="w-4 h-4 ml-auto flex-shrink-0 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
