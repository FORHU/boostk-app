import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { REDIRECT_REASON } from "@/enums/enums";
import { auth } from "@/lib/auth/auth";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  return next({ context: { authSession, request } });
});

export const requireAuthMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  return next({ context: { authSession, request } });
});
