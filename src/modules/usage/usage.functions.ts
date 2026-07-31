import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

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
