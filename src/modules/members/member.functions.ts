import { createServerFn } from "@tanstack/react-start";
import type { Prisma } from "prisma/generated/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";
import { GetOrgMembersSchema } from "./member.schema";
import { assertMemberMutable, assignableRoleSchema } from "./member.service";

const fetchMembersPaginated = async (
  organizationId: string,
  data: { page: number; pageSize: number; role?: string; search?: string },
) => {
  const search = data.search?.trim();

  const where: Prisma.MemberWhereInput = {
    organizationId,
    ...(data.role ? { role: data.role } : {}),
    ...(search
      ? {
          user: {
            is: {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
        }
      : {}),
  };

  const [total, members] = await prisma.$transaction([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      include: { user: true },
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      skip: (data.page - 1) * data.pageSize,
      take: data.pageSize,
    }),
  ]);

  return {
    members,
    total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: Math.max(1, Math.ceil(total / data.pageSize)),
  };
};

export const getAdminOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(GetOrgMembersSchema)
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data, context }) => {
    return fetchMembersPaginated(context.organization.id, data);
  });

export const getAgentProjectMembersFn = createServerFn({ method: "GET" })
  .inputValidator(GetOrgMembersSchema)
  .middleware([requireOrgRole(ORG_ROLE.AGENT)])
  .handler(async ({ data, context }) => {
    return fetchMembersPaginated(context.organization.id, data);
  });

export const getOrgAgentsFn = createServerFn({ method: "GET" })
  .inputValidator(GetOrgMembersSchema.pick({ organizationId: true }))
  .middleware([requireOrgRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.member.findMany({
      where: { organizationId: data.organizationId, role: ORG_ROLE.AGENT },
      include: { user: true },
      orderBy: { createdAt: "asc" as const },
    });
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
