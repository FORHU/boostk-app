// Server-side environment configuration, validated once at import time.
//
// Config errors belong at boot, not deep inside a request. Every server entry
// point (the app server via lib/prisma, the standalone socket server) imports
// this module, so a missing or malformed variable fails immediately with a
// readable listing instead of surfacing later as an opaque connection stack
// trace.
//
// IMPORTANT: this module is server-only. Never import it from a component that
// ships to the browser -- it would bundle DATABASE_URL and BETTER_AUTH_SECRET
// into the client. Client code that needs the build mode should use Vite's
// `import.meta.env.DEV`; client-visible config uses the `VITE_` prefix and is
// read from `import.meta.env` directly.

import { z } from "zod";

/**
 * GitHub Actions renders an unset `${{ vars.X }}` / `${{ secrets.X }}` as an
 * empty string rather than omitting the line, so the deployed .env can contain
 * `FORHU_CHAT_URL=`. Treat blank as absent so `.default()` and the
 * required-in-production checks below behave the way an operator expects.
 */
const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Wraps a schema so blank strings are normalized to `undefined` first. */
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blankToUndefined, schema);

const DEFAULT_RABBITMQ_URL = "amqp://127.0.0.1:5672";
const DEFAULT_FORHU_CHAT_URL = "https://chat-dev.forhu.ai";
const DEFAULT_SOCKET_PORT = 3001;

/**
 * Variables that must be set explicitly in production. These all have
 * dev-friendly defaults or are optional, which is convenient locally but a
 * footgun in production -- silently pointing at localhost RabbitMQ or running
 * auth with no trusted origins is worse than refusing to boot.
 */
const REQUIRED_IN_PRODUCTION = ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "TRUSTED_ORIGINS", "RABBITMQ_URL"] as const;

const EnvSchema = z
  .object({
    NODE_ENV: optional(z.enum(["development", "production", "test"]).default("development")),

    /** Postgres connection string used by the Prisma pg adapter. */
    DATABASE_URL: optional(
      // The `error` param covers the missing/undefined case; `.min(1)` alone
      // would only fire for a value that is already a string.
      z.string({ error: "required -- Postgres connection string, e.g. postgresql://user:pass@host:5432/db" }).min(1),
    ),

    /** Public origin better-auth mints callback URLs against. */
    BETTER_AUTH_URL: optional(z.url("must be an absolute URL, e.g. https://app.example.com").optional()),

    /** Signing secret for better-auth sessions. */
    BETTER_AUTH_SECRET: optional(z.string().min(16, "must be at least 16 characters").optional()),

    /** Comma-separated origin allowlist; see `env.trustedOrigins` for the parsed form. */
    TRUSTED_ORIGINS: optional(z.string().optional()),

    RABBITMQ_URL: optional(z.string().min(1).default(DEFAULT_RABBITMQ_URL)),

    SOCKET_PORT: optional(
      z.coerce
        .number({ error: "must be a port number" })
        .int("must be a whole number")
        .min(1)
        .max(65535)
        .default(DEFAULT_SOCKET_PORT),
    ),

    /** Base URL of the forhu chat API used as the translation engine. */
    FORHU_CHAT_URL: optional(
      z
        .url("must be an absolute URL")
        .default(DEFAULT_FORHU_CHAT_URL)
        // Callers append paths like `/chat`, so normalize away trailing slashes.
        .transform((url) => url.replace(/\/+$/, "")),
    ),

    /** Language support agents read in. */
    SUPPORT_LANGUAGE: optional(z.string().min(1).default("en")),

    /**
     * Override for the translation prompt. Left optional rather than defaulted
     * here: the fallback lives in `modules/translation/forhu-chat` and importing
     * it would make this module circular.
     */
    TRANSLATE_SYSTEM_PROMPT: optional(z.string().min(1).optional()),

    /** Comma separated list of emails for platform staff who have access to the triage dashboard. */
    PLATFORM_STAFF_EMAILS: optional(z.string().min(1).optional()),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;

    for (const key of REQUIRED_IN_PRODUCTION) {
      // Read the raw value, not the parsed one: fields with a default are always
      // populated after parsing, which would hide the fact they were never set.
      if (blankToUndefined(process.env[key]) === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "required when NODE_ENV=production",
        });
      }
    }
  });

/** Renders zod issues as an aligned, operator-readable list. */
const formatIssues = (issues: readonly z.core.$ZodIssue[]): string => {
  const rows = issues.map((issue) => [issue.path.join(".") || "(root)", issue.message] as const);
  const width = Math.max(...rows.map(([name]) => name.length));

  return rows.map(([name, message]) => `  ${name.padEnd(width)}  ${message}`).join("\n");
};

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Print the listing ourselves so the operator sees what to fix above whatever
  // stack trace the runtime decides to attach to the thrown error.
  console.error(
    [
      "",
      "✖ Invalid environment configuration",
      "",
      formatIssues(parsed.error.issues),
      "",
      "Set these in .env (see .env.example) or in your deployment environment.",
      "",
    ].join("\n"),
  );

  throw new Error(
    `Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
  );
}

const data = parsed.data;

export const env = {
  ...data,

  /** `TRUSTED_ORIGINS` split into a trimmed, non-empty list. */
  trustedOrigins:
    data.TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [],

  isProduction: data.NODE_ENV === "production",
  isDevelopment: data.NODE_ENV === "development",
  isTest: data.NODE_ENV === "test",
} as const;

export type Env = typeof env;
