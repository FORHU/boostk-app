import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auth as authServer } from "@/lib/auth";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";
import { requireOrganizationMiddleware } from "@/modules/organization/organization.middleware";
import { getProjectsByOrgId } from "@/modules/project/project.service";

export const listOrganizationsFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const { request } = context;
    const organizations = await authServer.api.listOrganizations({
      headers: request.headers,
    });
    return organizations;
  });

export const getActiveOrganizationFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const { request } = context;
    const activeOrg = await authServer.api.getFullOrganization({
      headers: request.headers,
    });
    return activeOrg;
  });

export const getOrgProjectsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrganizationMiddleware])
  .handler(async ({ context }) => {
    const { membership } = context;
    const orgProjects = await getProjectsByOrgId(membership.organizationId);

    return orgProjects;
  });
