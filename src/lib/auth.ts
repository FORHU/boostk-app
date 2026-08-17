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
  /**
   * Google sign-in, registered only when both credentials are present so the app still
   * boots on email and password alone (local dev, or a deploy where the OAuth client has
   * not been created yet).
   *
   * The redirect URI Google must have on its allowlist is derived from `baseURL`:
   *   <BETTER_AUTH_URL>/api/auth/callback/google
   * Google rejects raw IP addresses and non-HTTPS origins for anything but localhost, so
   * `BETTER_AUTH_URL` has to be the real https:// domain in every deployed environment.
   */
  socialProviders: env.googleAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,

  account: {
    accountLinking: {
      enabled: true,
      /**
       * Someone who registered with a password and later clicks "Continue with Google"
       * gets the two identities linked onto one user, instead of a second account with
       * the same email that owns none of their organizations.
       *
       * Stated explicitly rather than relied upon: better-auth will link an unlisted
       * provider only when it reports the email as verified. Google always does, so this
       * currently works either way — but that makes it an accident, and the failure mode
       * if it ever changed is a silently duplicated user.
       */
      trustedProviders: ["google"],
    },
  },

  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.trustedOrigins,
  plugins: [organization({ ac, roles })],
});
