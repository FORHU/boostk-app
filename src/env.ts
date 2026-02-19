import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
  },

  clientPrefix: "VITE_",
  client: {
    VITE_APP_ENV: z.enum(["local", "staging", "production"]),
    VITE_APP_URL: z.url(),
    VITE_BETTER_AUTH_URL: z.url().optional(),
  },

  runtimeEnv: {
    ...process.env,
    ...import.meta.env,
    VITE_BETTER_AUTH_URL: process.env.VITE_BETTER_AUTH_URL ?? process.env.VITE_APP_URL,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds where some secrets
   * might only be available at runtime.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
