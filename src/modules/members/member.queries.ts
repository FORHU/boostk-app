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

export const updateMemberRoleFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      memberId: z.string(),
      role: z.string(),
    }),
  )
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data, context }) => {
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    if (!member || member.organizationId !== context.organization.id) {
      throw new Error("Member not found or does not belong to this organization.");
    }

    const updatedMember = await prisma.member.update({
      where: { id: data.memberId },
      data: { role: data.role },
    });

    return updatedMember;
  });

export const removeMemberFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      organizationId: z.string(),
      memberId: z.string(),
    }),
  )
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data, context }) => {
    // 1. Verify the member belongs to the organization context
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    if (!member || member.organizationId !== context.organization.id) {
      throw new Error("Member not found or does not belong to this organization.");
    }

    // 2. Remove the member
    await prisma.member.delete({
      where: { id: data.memberId },
    });

    return { success: true };
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
