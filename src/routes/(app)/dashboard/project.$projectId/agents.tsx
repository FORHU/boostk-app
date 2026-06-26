import { createFileRoute, redirect } from "@tanstack/react-router";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { prisma } from "@/lib/prisma"
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireOrgRole } from "@/modules/organization/organization.middleware";
import { queryOptions } from "@tanstack/react-query";
import type { Member, User } from "prisma/generated/client";

export const getAgentsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.AGENT)])
  .handler(async ({ context }) => {
    return prisma.member.findMany({
      where: { organizationId: context.organization.id },
      include: { user: true }, 
      orderBy: { createdAt: "asc" },
    });
  });

export const agentQueries = {
  agents: ["agents"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...agentQueries.agents, organizationId],
      queryFn: () => getAgentsFn({ data: { organizationId } }),
    }),
}

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/agents")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.AGENT)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: ProjectAgentsPage,
});

function ProjectAgentsPage() {
  const members: Array<Member & { user: User }> = [];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-10">Agents</h1>
      </div>

      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" >Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" >Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" >Role</th>
              </tr>
            </thead>

        <tbody>
          {members.map((m) => (
            <tr key={m.id} >
              <td className=" px-6 py-4 text-left font-medium text-gray-800 text-sm">
                {m.user?.name ?? "-"}
              </td>
              
              <td className="text-left text-gray-500 text-sm">
                {m.user?.email ?? "-"}
              </td>
              
              <td className="text-left">
                  {m.role ?? "AGENT"}
              </td>
            </tr>
          ))}

          {members.length === 0 && (
          <tr>
            <td colSpan={3} className="py-8 text-center text-sm text-gray-500">
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