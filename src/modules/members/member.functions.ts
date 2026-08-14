import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";
import { assertMemberMutable, assignableRoleSchema } from "./member.service";

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
      role: assignableRoleSchema,
    }),
  )
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data, context }) => {
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    assertMemberMutable(member, context.organization.id, "update");

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
    // 1. Verify the member belongs to the organization context and is not the owner
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
    });

    assertMemberMutable(member, context.organization.id, "remove");

    // 2. Remove the member
    await prisma.member.delete({
      where: { id: data.memberId },
    });

    return { success: true };
  });
