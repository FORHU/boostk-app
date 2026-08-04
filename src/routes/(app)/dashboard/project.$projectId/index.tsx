import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Maximize2,
  MessageCircle,
  MessageSquarePlus,
  Minimize2,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Suspense, useState } from "react";
import { z } from "zod";
import { TextSkeleton, UsageCardsSkeleton } from "@/components/ui/skeleton";
import { useViewport } from "@/hooks/use-viewport";
import { formatRelative } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

// 1. BACKEND: Server Function for Agent-Gated Data
export const getProjectOverviewFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data: { projectId } }) => {
    const [openTickets, closedTickets, customers, recentTickets] = await prisma.$transaction([
      prisma.ticket.count({ where: { projectId, status: "OPEN" } }),
      prisma.ticket.count({ where: { projectId, status: "CLOSED" } }),
      prisma.customer.count({ where: { projectId } }),
      prisma.ticket.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return { openTickets, closedTickets, customers, recentTickets };
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
  const { isMobile } = useViewport();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLarge, setIsChatLarge] = useState(false);

  return (
    <div className="w-full h-[calc(100dvh-64px)] overflow-y-auto bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 lg:space-y-8 pb-32">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Overview</h1>
          <p className="text-muted-foreground mt-2">Overview of Project Metrics and Recent Activity</p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-10">
              <UsageCardsSkeleton className="space-y-0 p-0" />
              <TextSkeleton lines={5} className="max-w-full mt-8" />
            </div>
          }
        >
          <OverviewContent projectId={projectId} />
        </Suspense>
      </div>

      {/* ----- FLOATING CHAT WIDGET UI ----- */}
      <div
        className={`fixed right-4 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)] ${isMobile ? "bottom-24" : "bottom-6"}`}
      >
        {isChatOpen && (
          <div
            className={`mb-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200 relative transition-all border border-border
              ${
                isChatLarge
                  ? "w-[calc(100vw-2rem)] md:w-[800px] h-[80vh]"
                  : "w-[calc(100vw-2rem)] md:w-[380px] h-[60vh] max-h-[600px]"
              } `}
          >
            <button
              type="button"
              onClick={() => setIsChatLarge(!isChatLarge)}
              className="absolute top-3 right-3 z-10 p-2 backdrop-blur-sm text-slate-500 hover:text-slate-800 bg-white/50 rounded-md transition-all hidden md:block"
              title={isChatLarge ? "Shrink chat" : "Expand chat"}
            >
              {isChatLarge ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <iframe
              src={`/support/${projectId}/chat-widget`}
              className="w-full h-full border-none bg-slate-50 mt-0"
              title="Customer Support Chat"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center h-14 w-14 flex-shrink-0"
          aria-label="Toggle Chat"
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </div>
  );
}

function OverviewContent({ projectId }: { projectId: string }) {
  const query = useSuspenseQuery(projectQueries.overview(projectId));
  const { openTickets, closedTickets, customers, recentTickets } = query.data;

  type TicketSummary = { id: string; status: string; createdAt: string | Date };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Open Tickets</h3>
            <CircleDot className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{openTickets}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Require attention</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolved</h3>
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{closedTickets}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Successfully closed</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customers</h3>
            <Users className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{customers}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active in this project</p>
          </div>
        </div>
      </div>

      {/* Recent Tickets & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-6 py-5 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-foreground">Recent Tickets</h3>
            <Link
              to="/dashboard/project/$projectId/tickets"
              search={{ statusFilter: "all" }}
              params={{ projectId }}
              className="text-sm text-primary hover:underline flex items-center"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTickets.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No tickets found for this project yet.
              </div>
            ) : (
              recentTickets.map((ticket: TicketSummary) => (
                <Link
                  key={ticket.id}
                  to="/dashboard/project/$projectId/tickets"
                  search={{ statusFilter: "all" }}
                  params={{ projectId }}
                  className="flex items-center justify-between p-4 md:px-6 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{formatRelative(ticket.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                        ticket.status === "OPEN"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-3xl shadow-sm h-fit">
          <div className="px-4 md:px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
          </div>
          <div className="p-2">
            <Link
              to="/dashboard/project/$projectId/tickets"
              params={{ projectId }}
              search={{ statusFilter: "all" }}
              className="flex items-center p-3 rounded-[8px] hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <MessageSquarePlus className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Manage Tickets
            </Link>
            <Link
              to="/dashboard/project/$projectId/customers"
              params={{ projectId }}
              className="flex items-center p-3 rounded-[8px] hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <Users className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Customers
            </Link>
            <Link
              to="/dashboard/project/$projectId/settings"
              params={{ projectId }}
              className="flex items-center p-3 rounded-[8px] hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <Settings className="w-5 h-5 mr-3 flex-shrink-0 text-muted-foreground" />
              Project Settings
            </Link>
            <a
              href={`/support/${projectId}/chat-widget`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground mt-2 border-t border-border"
            >
              <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
              BoostK Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
