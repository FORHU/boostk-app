import { createServerFn } from "@tanstack/react-start";
import { createProjectSchema, getProjectBySlugSchema, getPublicProjectSchema } from "@/modules/project/project.schema";
import { createProject, getProjectByIdOrSlug, toPublicProject } from "@/modules/project/project.service";
import { requireOrganizationMiddleware } from "../organization/organization.middleware";
import { requireProjectMiddleware } from "./project.middleware";

export const createProjectFn = createServerFn({ method: "POST" })
  .middleware([requireOrganizationMiddleware])
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => {
    try {
      const project = await createProject(data);
      return project;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        throw new Error("A project with this slug already exists in this organization.");
      }
      throw new Error(error instanceof Error ? error.message : "Failed to create project.");
    }
  });

export const getProjectFn = createServerFn({ method: "GET" })
  .middleware([requireProjectMiddleware])
  .inputValidator(getProjectBySlugSchema)
  .handler(async ({ context }) => {
    // `requireProjectMiddleware` already validated access and resolved the
    // caller's role and member record; surface both so routes can role-gate
    // in `beforeLoad`.
    return { project: context.project, role: context.role, memberId: context.memberId };
  });

export const getProjectPublicFn = createServerFn({ method: "GET" })
  .inputValidator(getPublicProjectSchema)
  .handler(async ({ data }) => {
    const project = await getProjectByIdOrSlug(data.projectSlug);
    // Abort if the project slug/id is invalid or deleted.
    // This ensures `project` is defined before we check privacy settings.
    if (!project) {
      return null;
    }

    // suggestion: If we have a concept of "private" projects
    // if (project.isPrivate) {
    //   throw new Error("This project is private and cannot accept public users.");
    // }

    // Never return the whole row: `toPublicProject` is the whitelist that keeps
    // organizationId, slug and timestamps off an unauthenticated response.
    return toPublicProject(project);
  });
