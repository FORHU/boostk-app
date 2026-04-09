import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { auth } from "@/lib/auth/auth";
import { generateSlug } from "@/lib/utils";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { getProjectsByOrgId } from "@/modules/project/project.service";
import { createOrganizationSchema } from "./organization.schema";

export const getAuthOrganizationsFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const organizations = await auth.api.listOrganizations({
      headers: context.request.headers,
    });

    return organizations;
  });

// url based active organization
export const getOrganizationFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
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
      },
      headers: context.request.headers,
    });

    return organization;
  });
