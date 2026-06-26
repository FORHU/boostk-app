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
    <div className="bg-slate-100 me-10 rounded-lg">
      {/* Header Section */}
      <div className="mb-8 pt-6">
        <h2 className="text-lg font-medium mt-5 ">Agents</h2>
      </div>

      {/* The "Table" Wrapper */}
      <div className="w-full flex flex-col">
        
        {/* Table Header Row */}
        <div className="grid grid-cols-3 border-b-2 b pb-3 font-semibold text-slate-700">
          <h2 className="text-left pl-2">Name</h2>
          <h2 className="text-center">Email</h2>
          <h2 className="text-center">Role</h2>
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {members.map((m) => (
            <div 
              key={m.id} 
              className="grid grid-cols-3 items-center border-b border-slate-200 py-4 hover:bg-slate-200 transition-colors"
            >
              {/* Column 1: Name */}
              <div className="text-left pl-2 font-medium">
                {m.user?.name ?? "-"}
              </div>
              
              {/* Column 2: Email */}
              <div className="text-center text-slate-600">
                {m.user?.email ?? "-"}
              </div>
              
              {/* Column 3: Role */}
              <div className="text-center">
                {m.role ?? "AGENT"}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No agents assigned to this organization.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );}