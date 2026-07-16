import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const getOrgIntegrationsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data }) => {
    return prisma.integration.findMany({
      where: { organizationId: data.organizationId },
    });
  });

export const connectIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string(), provider: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data }) => {
    return prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId: data.organizationId,
          provider: data.provider,
        },
      },
      update: {},
      create: {
        organizationId: data.organizationId,
        provider: data.provider,
      },
    });
  });

export const disconnectIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string(), provider: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data }) => {
    return prisma.integration
      .delete({
        where: {
          organizationId_provider: {
            organizationId: data.organizationId,
            provider: data.provider,
          },
        },
      })
      .catch(() => null);
  });
