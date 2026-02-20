import { Elysia } from "elysia";
import { authMiddleware } from "../auth/service";
import { CreateProjectSchema } from "../project/project.schema";
import { CreateOrganizationSchema } from "./organization.schema";
import { OrganizationService } from "./organization.service";

export const organizationController = new Elysia({ prefix: "/organizations" })
  .use(authMiddleware)
  .post("/", ({ body, user }) => OrganizationService.create(body, user), {
    auth: true,
    body: CreateOrganizationSchema,
    detail: { tags: ["Organization"], summary: "Create a new organization" },
  })
  .get("/", () => OrganizationService.getAll(), {
    detail: { tags: ["Organization"], summary: "Get all organizations" },
  })
  // NESTED ROUTES: /organizations/:id/...
  .group("/:id", (app) =>
    app
      .get(
        "/projects",
        async ({ params: { id }, status }) => {
          const projects = await OrganizationService.getProjects(id);

          if (!projects) {
            return status(404, "Organization not found");
          }

          return projects;
        },
        {
          detail: { tags: ["Project"], summary: "Get all projects for this org" },
        },
      )
      .post("/projects", ({ params: { id }, body }) => OrganizationService.createProject(id, body), {
        body: CreateProjectSchema,
        detail: { tags: ["Project"], summary: "Create a project in this org" },
      }),
  );
