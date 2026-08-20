import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slugs that must never be user-chosen — they back system routes or the intake pipeline. */
export const RESERVED_SLUGS = ["boostk", "boostk-intake"] as const;

/**
 * Shared slug validation: lowercase alphanumeric + hyphens, no leading/trailing
 * hyphens, no consecutive hyphens, max 64 chars, not a reserved word.
 */
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(64, "Slug must be 64 characters or fewer")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and single hyphens (no leading/trailing)",
  )
  .refine((val) => !RESERVED_SLUGS.includes(val as (typeof RESERVED_SLUGS)[number]), "This slug is reserved");

export function generateSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const suffix = crypto.randomUUID().split("-")[0];

  return `${base}-${suffix}`;
}
