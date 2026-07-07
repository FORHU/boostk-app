import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { FolderKanban, Ticket, Users } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { TextSkeleton, UsageCardsSkeleton } from "@/components/ui/skeleton";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

// 1. BACKEND: Server Function
export const getOrgUsageFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    const [projects, members, tickets] = await prisma.$transaction([
      prisma.project.count({ where: { organizationId: context.organization.id } }),
      prisma.member.count({ where: { organizationId: context.organization.id } }),
      prisma.ticket.count({ where: { project: { organizationId: context.organization.id } } }),
    ]);
    return { projects, members, tickets };
  });

export const usageQueries = {
  usage: ["usage"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...usageQueries.usage, organizationId],
      queryFn: () => getOrgUsageFn({ data: { organizationId } }),
    }),
};

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/usage")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(usageQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationUsagePage,
});

//FRONTEND: Page and Components
function OrganizationUsagePage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <Suspense
        fallback={
          <div className="mx-auto p-6 md:p-10 space-y-10">
            <TextSkeleton lines={2} className="max-w-sm" />
            <UsageCardsSkeleton />
          </div>
        }
      >
        <UsageCards organizationId={organizationId} />
      </Suspense>
    </div>
  );
}

function UsageCards({ organizationId }: { organizationId: string }) {
  const query = useSuspenseQuery(usageQueries.allByOrgId(organizationId));
  const { projects, members, tickets } = query.data;
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 bg-background text-foreground">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usage Overview</h2>
        <p className="text-muted-foreground mt-2">View current statistics and limits for your organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Projects</h3>
            <FolderKanban className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{projects}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total active projects</p>
          </div>
        </div>

        {/* Members Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Members</h3>
            <Users className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{members}</p>
            <p className="text-xs text-muted-foreground  mt-1 font-medium">Registered team members</p>
          </div>
        </div>

        {/* Tickets Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground  uppercase tracking-wider">Tickets</h3>
            <Ticket className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground">{tickets}</p>
            <p className="text-xs text-muted-foreground  mt-1 font-medium">Created across all projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}
