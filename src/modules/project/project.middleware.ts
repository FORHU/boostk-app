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
    const result = z
      .object({ projectId: z.string().optional(), projectSlug: z.string().optional() })
      .refine((v) => v.projectId || v.projectSlug, "Project id or slug is required")
      .safeParse(data);

    if (!result.success) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.SERVER_ERROR } });
    }

    // URL resolution is slug-only; internal callers pass the cuid id. Matching each key
    // against its own column (never id OR slug) keeps legacy cuid URLs out of the router.
    const found = await prisma.project.findFirst({
      where: {
        ...(result.data.projectSlug ? { slug: result.data.projectSlug } : { id: result.data.projectId as string }),
        organization: { members: { some: { userId: context.authSession.user.id } } },
      },
      // Pull the owning org's members (to resolve the caller's role) and its slug (to
      // build the "back to projects" link without leaking the org's cuid).
      include: { organization: { select: { members: true, slug: true } } },
    });

    // A renamed project keeps serving its old slug via a redirect, so URLs and installed
    // widgets survive. Only the slug-resolved (URL) path participates — id callers keep the
    // existing permission-denied behavior.
    if (!found && result.data.projectSlug) {
      const previous = await prisma.project.findFirst({
        where: {
          previousSlugs: { has: result.data.projectSlug },
          organization: { members: { some: { userId: context.authSession.user.id } } },
        },
      });

      if (previous) {
        throw redirect({ to: "/dashboard/project/$projectSlug", params: { projectSlug: previous.slug } });
      }
    }

    if (!found) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    // Strip the joined organization back off so `project` stays a plain row, keeping only
    // the org slug for navigation.
    const { organization, ...project } = found;
    const member = organization.members.find((m) => m.userId === context.authSession.user.id);
    const role = getMemberRole(organization.members, context.authSession.user.id);

    return next({
      context: { project: { ...project, organizationSlug: organization.slug }, role, memberId: member?.id ?? null },
    });
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
