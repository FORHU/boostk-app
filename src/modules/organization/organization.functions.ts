import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { normalizeRole } from "@/modules/auth/roles";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { getProjectsByOrgId } from "@/modules/project/project.service";
import { createOrganizationSchema } from "./organization.schema";

export const getAuthOrganizationsFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const organizations = await auth.api.listOrganizations({
      headers: context.request.headers,
    });

    // Better Auth's listOrganizations returns organization rows only — no membership
    // role. The topbar needs the caller's role to decide whether to offer Billing, so
    // attach it here rather than making every consumer issue a second request.
    const memberships = await prisma.member.findMany({
      where: {
        userId: context.authSession.user.id,
        organizationId: { in: organizations.map((org) => org.id) },
      },
      select: { organizationId: true, role: true },
    });

    const roleByOrgId = new Map(memberships.map((m) => [m.organizationId, normalizeRole(m.role)]));

    const orgIds = organizations.map((org) => org.id);

    // groupBy's literal `by` fields don't typecheck against the generated client,
    // so fetch the scalars and reduce them in JS instead (same pattern as customer.functions.ts).
    const [projectRows, memberRows] = await Promise.all([
      prisma.project.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true },
      }),
      prisma.member.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true },
      }),
    ]);

    const projectCountByOrgId = new Map<string, number>();
    for (const row of projectRows) {
      projectCountByOrgId.set(row.organizationId, (projectCountByOrgId.get(row.organizationId) ?? 0) + 1);
    }

    const memberCountByOrgId = new Map<string, number>();
    for (const row of memberRows) {
      memberCountByOrgId.set(row.organizationId, (memberCountByOrgId.get(row.organizationId) ?? 0) + 1);
    }

    return organizations.map((org) => ({
      ...org,
      role: roleByOrgId.get(org.id) ?? null,
      _count: {
        projects: projectCountByOrgId.get(org.id) ?? 0,
        members: memberCountByOrgId.get(org.id) ?? 0,
      },
    }));
  });

// url based active organization
export const getOrganizationFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationSlug: z.string().min(1) }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ context }) => {
    return context.organization;
  });

// session based active organization
export const getActiveOrganizationFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const activeOrg = await auth.api.getFullOrganization({
      headers: context.request.headers,
    });

    if (!activeOrg) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.NO_ACTIVE_ORGANIZATION } });
    }

    return activeOrg;
  });

export const getOrgProjectsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ context }) => {
    const orgProjects = await getProjectsByOrgId(context.organization.id);

    return orgProjects;
  });

export const createOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(createOrganizationSchema)
  .middleware([requireAuthMiddleware])
  .handler(async ({ context, data }) => {
    const organization = await auth.api.createOrganization({
      body: {
        name: data.name,
        slug: generateSlug(data.name),
        userId: context.authSession.user.id,
        logo: data.logo || undefined,
      },
      headers: context.request.headers,
    });

    // Better Auth may ignore the logo field — persist it directly as a fallback.
    if (data.logo && organization?.id) {
      await prisma.organization.update({
        where: { id: organization.id },
        data: { logo: data.logo },
      });
    }

    return organization;
  });
