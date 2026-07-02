import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { prisma } from "@/lib/prisma";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";
import { Loader2 } from "lucide-react";

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

// 2. Query Options
export const projectTicketQueries = {
  tickets: ["project-tickets"],
  allByProjectId: (projectId: string) =>
    queryOptions({
      queryKey: [...projectTicketQueries.tickets, "all", projectId],
      queryFn: () => getProjectTicketsFn({ data: { projectId } }),
    }),
};

// 3. Loading Fallback(spinner)
function TicketsLoadingFallback() {
  return (
    <div className="p-6 flex flex-col min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/tickets")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ 
        to: "/dashboard/organizations", 
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED } 
      });
    }
  },
  pendingComponent: TicketsLoadingFallback,
  component: ProjectTicketsPage,
});

// 5. Main Page Component
function ProjectTicketsPage() {
  const { projectId } = Route.useParams();

  const { data: tickets } = useSuspenseQuery(
    projectTicketQueries.allByProjectId(projectId)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-10">Tickets</h1>
      
      {tickets.length === 0 ? (
        <div className="text-center p-12  rounded-lg">
          <h3 className="text-lg font-medium mt-5 ">No tickets yet</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reference Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {ticket.referenceNumber || "Unknown Reference"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-400">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    { ticket.customer.name ||"Unknown Customer"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );}