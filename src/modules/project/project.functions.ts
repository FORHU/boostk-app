import { createServerFn } from "@tanstack/react-start";
import { createProjectSchema } from "@/modules/project/project.schema";
import { createProject } from "@/modules/project/project.service";
import { requireOrganizationMiddleware } from "../organization/organization.middleware";

export const createProjectFn = createServerFn({ method: "POST" })
  .middleware([requireOrganizationMiddleware])
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => {
    const project = await createProject(data);

    return project;
  });
