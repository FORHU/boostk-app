import { createServerFn } from "@tanstack/react-start";
import { auth as authServer } from "@/lib/auth";
import { requireAuthMiddleware } from "../auth/auth.middleware";

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
