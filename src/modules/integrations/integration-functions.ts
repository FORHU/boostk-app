import { createServerFn } from "@tanstack/react-start";
import { Prisma } from "prisma/generated/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const INTEGRATION_PROVIDERS = ["whatsapp", "slack", "webhooks"] as const;

/**
 * Exported so the allowlist can be asserted in tests. `provider` is written straight to
 * the `Integration` row and forms half of the `organizationId_provider` unique key, so an
 * unvalidated value would create rows the UI can never surface or disconnect.
 */
export const providerSchema = z.enum(INTEGRATION_PROVIDERS);

export const getOrgIntegrationsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ data }) => {
    return prisma.integration.findMany({
      where: { organizationId: data.organizationId },
    });
  });

export const connectIntegrationFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ organizationId: z.string(), provider: providerSchema }))
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
  .inputValidator(z.object({ organizationId: z.string(), provider: providerSchema }))
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
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return null;
        }
        throw err;
      });
  });
