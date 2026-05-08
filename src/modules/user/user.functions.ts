import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "@/modules/auth/auth.middleware";

export const getUsersFn = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const users = await prisma.user.findMany();

    return users;
  });
