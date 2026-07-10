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
      // Only these roles are assignable via the UI. `owner` is intentionally
      // excluded — it stays a protected role reserved for the org creator.
      role: z.enum([ORG_ROLE.MEMBER, ORG_ROLE.AGENT, ORG_ROLE.ADMIN]),
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

    // The organization owner is protected: admins cannot change its role.
    if (member.role === ORG_ROLE.OWNER) {
      throw new Error("The organization owner's role cannot be changed.");
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

    // The organization owner is protected: admins cannot remove it.
    if (member.role === ORG_ROLE.OWNER) {
      throw new Error("The organization owner cannot be removed.");
    }

    // 2. Remove the member
    await prisma.member.delete({
      where: { id: data.memberId },
    });

    return { success: true };
  });
