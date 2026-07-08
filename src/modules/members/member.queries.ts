import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

const fetchMembers = async (organizationId: string) => {
  return prisma.member.findMany({
    where: { organizationId },
    include: { user: true },
    orderBy: { createdAt: "asc" as const },
  });
};

export const getAdminOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    return fetchMembers(context.organization.id);
  });

export const getAgentProjectMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.AGENT)])
  .handler(async ({ context }) => {
    return fetchMembers(context.organization.id);
  });

export const memberQueries = {
  members: ["members"],

  adminAllByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "admin", organizationId],
      queryFn: () => getAdminOrgMembersFn({ data: { organizationId } }),
    }),

  agentAllByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "agent", organizationId],
      queryFn: () => getAgentProjectMembersFn({ data: { organizationId } }),
    }),
};
