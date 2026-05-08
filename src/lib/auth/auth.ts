import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { admin as adminPlugin, organization } from "better-auth/plugins";
import { accessControl, admin, user } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      gender: {
        type: "string",
      },
      globalRoleId: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    adminPlugin({
      accessControl,
      roles: {
        admin,
        user,
      },
    }),
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
