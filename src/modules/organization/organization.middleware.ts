import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { requireAuthMiddleware } from "../auth/auth.middleware";

export const requireOrganizationMiddleware = createMiddleware({ type: "function" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ organizationId: z.string() }))
  .server(async ({ next, context, data }) => {
    const membership = await prisma.member.findFirst({
      where: {
        organizationId: data.organizationId,
        userId: context.authSession.user.id,
      },
    });

    if (!membership) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }

    return next({ context: { membership } });
  });
