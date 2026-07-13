import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireProjectRole } from "@/modules/project/project.middleware";

export const getProjectCustomersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ projectId: z.string() }))
  .middleware([requireProjectRole(ORG_ROLE.AGENT)])
  .handler(async ({ data }) => {
    return prisma.customer.findMany({
      where: { projectId: data.projectId },
      include: {
        project: true,
        tickets: {
          orderBy: { updatedAt: "desc" as const },
          include: {
            ticketMessages: {
              orderBy: { createdAt: "asc" as const },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" as const },
    });
  });
