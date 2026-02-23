import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/env";
import { prisma } from "../../prisma/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: {
        type: "string",
        optional: true,
      },
      status: {
        type: "string",
        optional: true,
      },
      orgId: {
        type: "string",
        optional: true,
      },
    },
  },
});
