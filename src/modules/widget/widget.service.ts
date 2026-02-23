import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { prisma } from "prisma/db";
import { z } from "zod";

const widgetInputValidator = z.object({
  apiKey: z.string(),
  domain: z.string(),
});

export const validateWidgetAccess = createServerFn({ method: "GET" })
  .inputValidator(widgetInputValidator)
  .handler(async ({ data }) => {
    const { apiKey } = data;

    const project = await prisma.project.findUnique({
      where: { apiKey },
      select: {
        allowedDomains: true,
        widgetConfig: true,
      },
    });

    if (!project) throw redirect({ to: "/widget/access-denied" });

    // TODO: implement domain validation
    // const isAllowed = project.allowedDomains.some((allowed) => domain.includes(allowed));

    // if (!isAllowed && process.env.NODE_ENV === "production") {
    //   throw redirect({
    //     to: "/widget/access-denied",
    //   });
    // }

    return {
      success: true,
      config: project.widgetConfig,
    };
  });
