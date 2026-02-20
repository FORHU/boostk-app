import { Elysia } from "elysia";
import { prisma } from "prisma/db";

export const projectController = new Elysia({ prefix: "/projects" }).get(
  "/:projectId",
  async ({ params: { projectId } }) => {
    return await prisma.project.findUnique({
      where: { id: projectId },
    });
  },
  {
    detail: { tags: ["Project"], summary: "Get a single project by ID" },
  },
);
