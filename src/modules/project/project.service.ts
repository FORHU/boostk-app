import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";

export class OrganizationService {
  async getProjectsByOrgId(organizationId: string) {
    // Replace this with your actual DB call (Drizzle, Prisma, etc.)
    // return db.projects.findMany({ where: { organizationId } });
    return [
      { id: "p1", name: "Alpha Project", organizationId },
      { id: "p2", name: "Beta Project", organizationId },
    ];
  }

  async createProject(organizationId: string, data: { name: string }) {
    // Logic to create a project under this organization
    return { id: "p3", ...data, organizationId };
  }
}

const updateProjectDomainsInputValidator = z.object({ projectId: z.string(), allowedDomains: z.array(z.string()) });

export const updateProjectDomains = createServerFn({ method: "POST" })
  .inputValidator(updateProjectDomainsInputValidator)
  .handler(async ({ data }) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const updatedProject = await prisma.project.update({
      where: { id: data.projectId },
      data: { allowedDomains: data.allowedDomains },
    });

    return { success: true, project: updatedProject };
  });
