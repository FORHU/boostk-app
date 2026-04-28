import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth/auth";
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

export const userHasPermissionFn = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context, body }) => {
    const data = await auth.api.userHasPermission({
      body: {
        userId: "user-id",
        role: "admin", // server-only
        // permission: { project: ["create", "update"] } /* Must use this, or permissions */,
      },
    });
  });
