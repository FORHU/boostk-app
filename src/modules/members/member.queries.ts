import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const getOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.AGENT)])
  .handler(async ({ context }) => {
    return prisma.member.findMany({
      where: { organizationId: context.organization.id },
      include: { user: true },
      orderBy: { createdAt: "asc" as const },
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
