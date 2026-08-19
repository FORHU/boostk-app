import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "../auth/auth.middleware";
import { getMemberRole, hasOrgRole, type OrgRole } from "../auth/roles";

export const requireOrganizationMiddleware = createMiddleware({ type: "function" })
  .middleware([requireAuthMiddleware])
  .server(async ({ next, context, data }) => {
    const result = z
      .object({ organizationId: z.string().optional(), organizationSlug: z.string().optional() })
      .refine((v) => v.organizationId || v.organizationSlug, "Organization id or slug is required")
      .safeParse(data);

    if (!result.success) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.SERVER_ERROR } });
    }

    // URL resolution is slug-only; internal callers pass the cuid id. Matching each key
    // against its own column (never id OR slug) keeps legacy cuid URLs out of the router.
    const organization = await prisma.organization.findFirst({
      where: {
        ...(result.data.organizationSlug
          ? { slug: result.data.organizationSlug }
          : { id: result.data.organizationId as string }),
        members: { some: { userId: context.authSession.user.id } },
      },
      include: { members: true },
    });

    if (!organization) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    const role = getMemberRole(organization.members, context.authSession.user.id);

    return next({ context: { organization, role } });
  });

/**
 * Wraps `requireOrganizationMiddleware` and additionally requires the caller's
 * org role to meet or exceed `minRole`. Server-side enforcement for role-gated
 * server functions (defense-in-depth alongside route `beforeLoad` guards).
 */
export const requireOrgRole = (minRole: OrgRole) =>
  createMiddleware({ type: "function" })
    .middleware([requireOrganizationMiddleware])
    .server(async ({ next, context }) => {
      if (!hasOrgRole(context.role, minRole)) {
        throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
      }

      return next();
    });
