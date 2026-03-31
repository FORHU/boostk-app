import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { auth } from "@/lib/auth";

const REDIRECT_REASON = {
  AUTH_REQUIRED: "auth_required",
  PERMISSION_DENIED: "permission_denied",
  NO_ACTIVE_ORGANIZATION: "no_active_organization",
} as const;

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });

  return next({ context: { authSession, request } });
});

export const requireAuthMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  return next({ context: { authSession, request } });
});
