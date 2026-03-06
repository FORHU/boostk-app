import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";

export const getProjectFn = createServerFn({ method: "GET" })
  .inputValidator((data: { projectId: string; includeOrganization?: boolean }) => data)
  .handler(async ({ data }) => {
    return await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        organization: data.includeOrganization,
      },
    });
  });
