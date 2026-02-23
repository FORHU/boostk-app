import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";

export const getProjects = createServerFn({ method: "GET" })
  .inputValidator(z.object({ includeTickets: z.boolean().optional() }))
  .handler(async ({ data }) => {
    const projects = await prisma.project.findMany({
      include: {
        tickets: data.includeTickets,
      },
    });

    return projects;
  });

export const getOrganizationProjects = createServerFn({ method: "GET" })
  .inputValidator(z.object({ orgId: z.string() }))
  .handler(async ({ data }) => {
    const projects = await prisma.project.findMany({
      where: { organization: { id: data.orgId } },
    });

    return projects;
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      projectId: z.string(),
      includeTickets: z.boolean().optional(),
      includeOrganization: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        tickets: data.includeTickets,
        organization: data.includeOrganization,
      },
    });

    return project;
  });

export const createProject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), organizationId: z.string() }))
  .handler(async ({ data }) => {
    const project = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          apiKey: "",
          organization: { connect: { id: data.organizationId } },
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
