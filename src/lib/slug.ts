import { z } from "zod";

export const SLUG_MAX = 64;

// Segments that could collide with a static route sitting at the same level as a
// $projectSlug / $organizationSlug segment. Preventive today: every sub-route currently
// lives one segment BELOW the slug, so none of these conflict yet — but a future static
// route (e.g. /dashboard/project/new or /support/manifest) would silently shadow a
// tenant that squatted the word.
export const RESERVED_SLUGS = new Set([
  "manifest",
  "chat-widget",
  "chat",
  "support",
  "api",
  "dashboard",
  "org",
  "project",
  "organizations",
  "signin",
  "signup",
  "forgot-password",
  "reset-password",
  "new",
  "create",
  "edit",
  // project child segments
  "tickets",
  "customers",
  "settings",
  "chat-support",
  "agents",
  // organization child segments
  "teams",
  "integrations",
  "billing",
  "usage",
  // seeded intake pipeline — must never be squatted by a tenant
  "boostk",
  "boostk-intake",
]);

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(SLUG_MAX, `Slug must be ${SLUG_MAX} characters or fewer`)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
  .refine((value) => /[a-z0-9]/.test(value), "Slug must contain at least one letter or number")
  .refine((value) => !RESERVED_SLUGS.has(value), "This slug is reserved. Please choose another one.");

/**
 * Derive a URL slug from a display name.
 *
 * Non-ASCII characters are stripped, so a name with no `[a-z0-9]` characters (Korean,
 * Arabic, emoji, …) collapses to an empty base — `fallback` keeps that from producing a
 * leading-hyphen slug, and the random suffix keeps collisions improbable.
 */
export function generateSlug(name: string, fallback = "untitled") {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX - 9); // reserve space for the "-" + 8-hex suffix

  const suffix = crypto.randomUUID().split("-")[0];

  return `${base || fallback}-${suffix}`;
}
