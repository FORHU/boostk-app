import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "../auth/auth.middleware";
import { getMemberRole, hasOrgRole, type OrgRole } from "../auth/roles";

export const requireProjectMiddleware = createMiddleware({ type: "function" })
  .middleware([requireAuthMiddleware])
  .server(async ({ next, context, data }) => {
    const result = z.object({ projectId: z.string() }).safeParse(data);

    if (!result.success) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.SERVER_ERROR } });
    }

    const found = await prisma.project.findFirst({
      where: {
        id: result.data.projectId,
        organization: { members: { some: { userId: context.authSession.user.id } } },
      },
      // Pull the owning org's members so we can resolve the caller's role.
      include: { organization: { select: { members: true } } },
    });

    if (!found) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    // Strip the joined organization back off so `project` stays a plain row.
    const { organization, ...project } = found;
    const member = organization.members.find((m) => m.userId === context.authSession.user.id);
    const role = getMemberRole(organization.members, context.authSession.user.id);

    return next({ context: { project, role, memberId: member?.id ?? null } });
  });

/**
 * Wraps `requireProjectMiddleware` and additionally requires the caller's role
 * in the owning org to meet or exceed `minRole`.
 */
export const requireProjectRole = (minRole: OrgRole) =>
  createMiddleware({ type: "function" })
    .middleware([requireProjectMiddleware])
    .server(async ({ next, context }) => {
      if (!hasOrgRole(context.role, minRole)) {
        throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
      }

      return next();
    });
