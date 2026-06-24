import { prisma } from "@/lib/prisma"
import { createFileRoute } from "@tanstack/react-router"; 
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";



export const getOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ context }) => {
    return prisma.member.findMany({
      where: { organizationId: context.organization.id },
      include: { user: true }, 
      orderBy: { createdAt: "asc" },
    });
  });

export const memberQueries = {
  members: ["members"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "members", organizationId],
      queryFn: () => getOrgMembersFn({ data: { organizationId } }),
    }),
}

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/teams")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(memberQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationTeamsPage,
});

function OrganizationTeamsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div className="ml-12 mt-6">
      <h1 className="uppercase text-2xl font-bold">Teams</h1>
      <p className="mb-8">id: {organizationId}</p>

      <div>
        <Suspense fallback={<p> loading members</p>}> 
          <TeamTable organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
}

function TeamTable({ organizationId }: { organizationId: string }) {
  const query = useSuspenseQuery(memberQueries.allByOrgId(organizationId));
  const members = query.data ?? [];

  return (
<div className="bg-slate-100 me-10 rounded-lg">
  {/* Header Section */}
  <div className="text-center mb-8">
    <h2 className="font-semibold text-lg">Members</h2>
    <p className="text-slate-600">
      List of members in your organization including their name, email and role.
    </p>
  </div>

  {/* The "Table" Wrapper */}
  <div className="w-full flex flex-col">
    
    {/* Table Header Row */}
    {/* grid-cols-3 splits this row into 3 equal columns */}
    <div className="grid grid-cols-3 border-b-2 border-slate-300 pb-3 font-semibold text-slate-700">
      <h2 className="text-left pl-2">Name</h2>
      <h2 className="text-center">Email</h2>
      <h2 className="text-center">Role</h2>
    </div>

    {/* Table Body */}
    <div className="flex flex-col">
      {members.map((m: any) => (
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
            {m.role ?? "member"}
          </div>
        </div>
      ))}
    </div>
    
  </div>
</div>
  );
}
