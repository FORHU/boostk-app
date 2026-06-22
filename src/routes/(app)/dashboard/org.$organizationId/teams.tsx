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
    <div>
      <h1>Teams - {organizationId}</h1>
      <div>
        <p className="">Welcome to Organization Teams Page</p>
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
    <div>
      <table>
        <div className="to-card-foreground">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id}>
                  <td className="p-5">{m.user?.name ?? "-"}</td>
                  <td className="p-5">{m.user?.email ?? "-"}</td>
                  <td className="p-5">{m.role ?? "member"}</td>
                </tr>
              ))}
            </tbody>
          </div>
        </table>
    </div>
  );
}
