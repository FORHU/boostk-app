import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";

export const getOrganization = createServerFn({ method: "GET" })
  .inputValidator(z.object({ orgId: z.string() }))
  .handler(async ({ data }) => {
    const organization = await prisma.organization.findUnique({
      where: { id: data.orgId },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
    });
    return organization;
  });

export const getOrganizations = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const organizations = await prisma.organization.findMany({
      where: { members: { some: { userId: data.userId } } },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
    });

    return organizations;
  });
