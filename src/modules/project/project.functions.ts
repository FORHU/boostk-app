import { createServerFn } from "@tanstack/react-start";
import { createProjectSchema, getProjectSchema } from "@/modules/project/project.schema";
import { createProject, getProjectById } from "@/modules/project/project.service";
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
        throw new Error("You already have a project with that name.");
      }
      throw new Error("Failed to create project.");
    }
  });

export const getProjectFn = createServerFn({ method: "GET" })
  .middleware([requireProjectMiddleware])
  .inputValidator(getProjectSchema)
  .handler(async ({ context }) => {
    // `requireProjectMiddleware` already validated access and resolved the
    // caller's role and member record; surface both so routes can role-gate
    // in `beforeLoad`.
    return { project: context.project, role: context.role, memberId: context.memberId };
  });

export const getProjectPublicFn = createServerFn({ method: "GET" })
  .inputValidator(getProjectSchema)
  .handler(async ({ data }) => {
    const project = await getProjectById(data.projectId);
    // Abort if the project ID is invalid or deleted.
    // This ensures `project` is defined before we check privacy settings.
    if (!project) {
      return null;
    }

    // suggestion: If we have a concept of "private" projects
    // if (project.isPrivate) {
    //   throw new Error("This project is private and cannot accept public users.");
    // }

    //to avoid leaking all the data add only what public can show so dont return the whole project(return project)
    return {
      name: project.name,
      id: project.id,
      logo: project.logo,
      description: project.description,
    };
  });
