import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, requireAuthMiddleware } from "./auth.middleware";

export const getAuthUserSessionFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.authSession;
  });

export const getAuthenticatedUserFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    return context.authSession;
  });
