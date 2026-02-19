import { Elysia } from "elysia";
import { CreateOrganizationSchema } from "./organization.model";
import { OrganizationService } from "./organization.service";

export const organizationController = new Elysia().group("/organizations", (app) =>
  app
    .post("/", ({ body }) => OrganizationService.create(body), {
      body: CreateOrganizationSchema,
      detail: {
        summary: "Create a new organization",
        tags: ["Organization"],
      },
    })
    .get("/", () => OrganizationService.getAll(), {
      detail: {
        summary: "Get all organizations",
        tags: ["Organization"],
      },
    }),
);
