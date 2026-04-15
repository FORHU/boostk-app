import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema";

export const getProjectsByOrgId = async (organizationId: string) => {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });

  return projects;
};

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  return project;
};

export const createProject = async (data: CreateProjectInput) => {
  const project = await prisma.project.create({
    data: {
      ...data,
      slug: generateSlug(data.name),
    },
  });

  return project;
};

export const updateProject = async (data: UpdateProjectInput) => {
  const project = await prisma.project.update({
    where: { id: data.projectId },
    data: { name: data.name },
  });

  return project;
};
