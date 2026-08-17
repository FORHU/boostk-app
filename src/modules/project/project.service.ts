import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import type { CreateProjectInput } from "./project.schema";

export interface OrgProjectListItem {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  slug: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { customers: number; tickets: number };
}

export const getProjectsByOrgId = async (organizationId: string): Promise<OrgProjectListItem[]> => {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          customers: true,
          tickets: { where: { status: "OPEN" } },
        },
      },
    },
  });

  return projects as unknown as OrgProjectListItem[];
};

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  return project;
};

/** The only project fields an unauthenticated visitor is allowed to see. */
export type PublicProject = {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
};

/**
 * Narrow a project row to the fields the public chat widget may render.
 *
 * `getProjectPublicFn` has no auth middleware — anyone holding a project id can call it —
 * so this is the boundary that keeps `organizationId`, `slug` and timestamps off the
 * wire. Extracted from the handler so the whitelist can be asserted directly: a field
 * added to the model would otherwise only be caught by someone re-reading the handler.
 */
export const toPublicProject = (project: {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
}): PublicProject => ({
  id: project.id,
  name: project.name,
  logo: project.logo,
  description: project.description,
});

export const createProject = async (data: CreateProjectInput) => {
  const project = await prisma.project.create({
    data: {
      ...data,
      slug: generateSlug(data.name),
    },
  });

  return project;
};
