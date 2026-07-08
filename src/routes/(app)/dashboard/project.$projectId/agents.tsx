import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { Member, User } from "prisma/generated/client";
import { Suspense } from "react";
import { DataTableSkeleton, TextSkeleton } from "@/components/ui/skeleton";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { memberQueries } from "@/modules/members/member.queries";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/agents")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(memberQueries.allByOrgId(context.project.organizationId));
  },
  component: ProjectAgentsPage,
});

function ProjectAgentsPage() {
  const { project } = Route.useRouteContext();

  return (
    <div>
      <Suspense
        fallback={
          <div className="mx-auto p-6 md:p-10 space-y-10">
            <TextSkeleton lines={1} />
            <DataTableSkeleton />
          </div>
        }
      >
        <AgentTable organizationId={project.organizationId} />
      </Suspense>
    </div>
  );
}

function AgentTable({ organizationId }: { organizationId: string }) {
  const query = useSuspenseQuery(memberQueries.allByOrgId(organizationId));
  const Allmembers = (query.data ?? []) as Array<Member & { user: User }>;
  const members = Allmembers.filter((m) => hasOrgRole(m.role, ORG_ROLE.AGENT));

  return (
    <div className="p-4 md:p-6 w-full overflow-hidden">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold mb-10">Agents</h1>
      </div>
      <div className="overflow-x-auto w-full rounded-lg border border-border shadow-sm">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{m.user?.name ?? "-"}</td>

                <td className=" text-muted-foreground px-6 py-4 whitespace-nowrap text-sm">{m.user?.email ?? "-"}</td>

                <td className="first-letter:uppercase text-muted-foreground px-6 py-4 whitespace-nowrap text-sm">
                  {m.role ?? "AGENT"}
                </td>
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No agents assigned to this organization.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
