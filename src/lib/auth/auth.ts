import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";
import { accessControl } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    organization({
      accessControl,
      dynamicAccessControl: {
        enabled: true,
      },
      teams: {
        enabled: true,
        allowRemovingAllTeams: false,
      },
    }),
  ],
});
