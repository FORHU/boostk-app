import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { REDIRECT_REASON } from "@/enums/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPlatformRole } from "./roles";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  return next({ context: { authSession, request } });
});

export const requireAuthMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  return next({ context: { authSession, request } });
});

/**
 * Guards the global triage surfaces, which read intake conversations across every
 * organization. Authority comes from `users.platformRole` alone — org membership
 * grants nothing here, and holding platform staff grants nothing inside any org.
 *
 * `platformRole` is read from the database rather than the session payload so a
 * revoked role takes effect on the next request instead of whenever the session
 * happens to be refreshed.
 */
export const requirePlatformStaffMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  const user = await prisma.user.findUnique({
    where: { id: authSession.user.id },
    select: { platformRole: true },
  });

  if (!hasPlatformRole(user?.platformRole)) {
    throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
  }

  return next({ context: { authSession, request } });
});
