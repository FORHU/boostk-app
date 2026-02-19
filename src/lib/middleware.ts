import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { env } from "@/env";
import { auth } from "@/lib/auth";

const REDIRECT_REASON = {
  AUTH_REQUIRED: "auth_required",
  LOCAL_ONLY: "local_only",
} as const;

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect({ to: "/signin", search: { reason: REDIRECT_REASON.AUTH_REQUIRED } });

  return next({ context: { session } });
});

export const assertLocalMiddleware = createMiddleware().server(async ({ next }) => {
  if (!env.isLocal) throw redirect({ to: "/", search: { reason: REDIRECT_REASON.LOCAL_ONLY } });

  return next({
    context: {
      isLocal: env.isLocal,
    },
  });
});
