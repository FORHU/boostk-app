import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { Member, User } from "prisma/generated/client";
import { Suspense } from "react";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const getOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
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
      queryKey: [...memberQueries.members, organizationId],
      queryFn: () => getOrgMembersFn({ data: { organizationId } }),
    }),
};

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/teams")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(memberQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationTeamsPage,
});

function OrganizationTeamsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div>
      <Suspense fallback={<p> loading members</p>}>
        <TeamTable organizationId={organizationId} />
      </Suspense>
    </div>
  );
}

function TeamTable({ organizationId }: { organizationId: string }) {
  const query = useSuspenseQuery(memberQueries.allByOrgId(organizationId));
  // The server fn includes the `user` relation at runtime, but the server-fn
  // boundary widens the type back to the base row — restore it here.
  const members = (query.data ?? []) as Array<Member & { user: User }>;

  return (
    <div className="p-6 ">
      <h1 className="text-2xl font-bold mb-8">Teams</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th colSpan={3} className="px-6 py-4 text-left text-xs font-semibold uppercase">
                Members
              </th>
            </tr>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm ">{m.user?.name ?? "-"}</td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.user?.email ?? "-"}</td>

                <td className="first-letter:uppercase px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {m.role ?? "member"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
