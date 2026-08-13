import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { env } from "@/env";
import { sendPasswordResetEmail } from "@/lib/email";
import { ac, roles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
  },
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.trustedOrigins,
  plugins: [organization({ ac, roles })],
});
