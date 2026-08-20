import { prisma } from "@/lib/prisma";
import { generateSlug, RESERVED_SLUGS } from "@/lib/utils";
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

export const getProjectByIdOrSlug = async (identifier: string) => {
  const project = await prisma.project.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
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
 * `getProjectPublicFn` has no auth middleware — anyone holding a project id or slug can
 * call it — so this is the boundary that keeps `organizationId`, `slug` and timestamps off
 * the wire. Extracted from the handler so the whitelist can be asserted directly: a field
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

const MAX_SLUG_RETRIES = 3;

export const createProject = async (data: CreateProjectInput) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const slug = generateSlug(data.name);

    if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
      continue;
    }

    try {
      const project = await prisma.project.create({
        data: {
          ...data,
          slug,
        },
      });
      return project;
    } catch (error) {
      lastError = error;
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        continue;
      }
      throw new Error("Failed to create project.");
    }
  }

  if (lastError && typeof lastError === "object" && "code" in lastError && lastError.code === "P2002") {
    throw new Error("Failed to generate a unique slug. Please try again.");
  }
  throw new Error("Failed to create project.");
};
