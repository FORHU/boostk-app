import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import Elysia from "elysia";
import { prisma } from "prisma/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export const authMiddleware = new Elysia({ name: "better-auth" }).mount(auth.handler).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });

      if (!session) return status(401, "Unauthorized");

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
