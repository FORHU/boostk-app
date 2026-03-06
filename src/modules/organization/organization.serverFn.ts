import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";

import { authMiddleware, ownerMiddleware } from "@/lib/middleware";

// TODO: pagination, filters, sorting
export const getOrganizationsFn = createServerFn({ method: "GET" })
  .middleware([ownerMiddleware])
  .handler(async () => {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
    });
    return organizations;
  });

export const createOrganizationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1, "Name is required") }))
  .handler(async ({ data, context }) => {
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        members: {
          connect: { id: context.authSession.user.id },
        },
      },
    });

    return organization;
  });

export const getOrganizationsByAuthUserFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const organizations = await prisma.organization.findMany({
      where: { members: { some: { id: context.authSession.user.id } } },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
      },
    });
    return organizations;
  });

// TODO: add auth middleware, org membership check middleware
export const getOrganizationByIdFn = createServerFn({ method: "GET" })
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

// TODO: add auth middleware, org membership check middleware
export const getOrgProjectsFn = createServerFn({ method: "GET" })
  .inputValidator((data: { orgId: string }) => data)
  .handler(async ({ data }) => {
    const projects = await prisma.project.findMany({
      where: { orgId: data.orgId },
    });
    return projects;
  });

const createOrgProjectValidator = z.object({
  orgId: z.string(),
  name: z.string().min(1, "Project name is required"),
  allowedDomains: z.array(z.string()).default([]),
});

// TODO: add auth middleware, org membership check middleware
export const createOrgProjectFn = createServerFn({ method: "POST" })
  .inputValidator(createOrgProjectValidator)
  .handler(async ({ data }) => {
    const project = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          apiKey: "",
          organization: { connect: { id: data.orgId } },
        },
      });

      return await tx.project.update({
        where: { id: project.id },
        data: {
          apiKey: `ch-api-${project.id}`,
        },
      });
    });
    return project;
  });
