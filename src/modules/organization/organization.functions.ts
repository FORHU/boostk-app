import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { getProjectsByOrgId } from "@/modules/project/project.service";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.schema";

export const getAuthOrganizationsFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const authOrgs = await auth.api.listOrganizations({
      headers: context.request.headers,
    });

    const orgIds = authOrgs.map((org) => org.id);
    const authOrganizations = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      include: {
        members: {
          orderBy: {
            createdAt: "asc" as const, // Added const here to fix the type mismatch
          },
          take: 5,
          include: { user: true },
        },
        _count: {
          select: { members: true, projects: true },
        },
      },
    });

    return authOrganizations;
  });
export type GetAuthOrganizationsResponse = Awaited<ReturnType<typeof getAuthOrganizationsFn>>;
export type GetAuthOrganization = GetAuthOrganizationsResponse[number];

// url based active organization
export const getOrganizationFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ context }) => {
    return context.organization;
  });
export type GetOrganizationReturn = Awaited<ReturnType<typeof getOrganizationFn>>;

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

    const dbOrg = await prisma.organization.findUnique({
      where: { id: activeOrg.id },
      select: { status: true },
    });

    return {
      ...activeOrg,
      status: dbOrg?.status ?? "ACTIVE",
    };
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
      },
      headers: context.request.headers,
    });

    return organization;
  });

export const updateOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(updateOrganizationSchema)
  .middleware([requireAuthMiddleware])
  .handler(async ({ context, data }) => {
    const organization = await auth.api.updateOrganization({
      body: {
        organizationId: data.id,
        data: {
          name: data.name,
        },
      },
      headers: context.request.headers,
    });

    return organization;
  });

export const deactivateOrganizationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireAuthMiddleware])
  .handler(async ({ data }) => {
    const organization = await prisma.organization.update({
      where: { id: data.organizationId },
      data: { status: "INACTIVE" },
    });

    return organization;
  });
