import { createServerFn } from "@tanstack/react-start";
import { createProjectSchema, getProjectSchema, updateProjectSchema } from "@/modules/project/project.schema";
import { createProject, getProjectById, updateProject } from "@/modules/project/project.service";
import { requireOrganizationMiddleware } from "../organization/organization.middleware";
import { requireProjectMiddleware } from "./project.middleware";

export const createProjectFn = createServerFn({ method: "POST" })
  .middleware([requireOrganizationMiddleware])
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => {
    const project = await createProject(data);
    return project;
  });

export const getProjectFn = createServerFn({ method: "GET" })
  .middleware([requireProjectMiddleware])
  .inputValidator(getProjectSchema)
  .handler(async ({ data }) => {
    const project = await getProjectById(data.projectId);
    return project;
  });

export const updateProjectFn = createServerFn({ method: "POST" })
  .middleware([requireProjectMiddleware])
  .inputValidator(updateProjectSchema)
  .handler(async ({ data }) => {
    const project = await updateProject(data);
    return project;
  });

// TODO: make this more secure
export const getProjectPublicFn = createServerFn({ method: "GET" })
  .inputValidator(getProjectSchema)
  .handler(async ({ data }) => {
    const project = await getProjectById(data.projectId);
    return project;
  });
