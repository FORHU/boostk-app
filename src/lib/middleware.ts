import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { env } from "@/env";
import { auth } from "@/lib/auth";

const REDIRECT_REASON = {
  AUTH_REQUIRED: "auth_required",
  LOCAL_ONLY: "local_only",
} as const;

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  return next({ context: { authSession } });
});

export const ownerMiddleware = createMiddleware({ type: "function" })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const { user } = context.authSession;

    if (user.role !== "OWNER") throw redirect({ to: "/" });

    return next();
  });

export const assertLocalMiddleware = createMiddleware().server(async ({ next }) => {
  if (env.NODE_ENV !== "development") throw redirect({ to: "/", search: { reason: REDIRECT_REASON.LOCAL_ONLY } });

  return next({
    context: {
      isLocal: env.NODE_ENV === "development",
    },
  });
});
