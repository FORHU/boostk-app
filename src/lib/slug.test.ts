import { describe, expect, it } from "vitest";
import { generateSlug, RESERVED_SLUGS, SLUG_MAX, slugSchema } from "./slug";

describe("generateSlug", () => {
  it("lowercases, trims, and hyphenates spaces", () => {
    const slug = generateSlug("  Hello   World  ");
    expect(slug.startsWith("hello-world-")).toBe(true);
  });

  it("strips punctuation and collapses repeated hyphens", () => {
    const slug = generateSlug("A--B!!! C");
    expect(slug.startsWith("a-b-c-")).toBe(true);
    expect(slug).not.toContain("--");
  });

  it("falls back to a stable token for non-ASCII names instead of a leading hyphen", () => {
    const slug = generateSlug("한국어");
    expect(slug.startsWith("-")).toBe(false);
    expect(slug.startsWith("untitled-")).toBe(true);
  });

  it("uses the supplied fallback", () => {
    expect(generateSlug("🚀", "project").startsWith("project-")).toBe(true);
  });

  it("keeps the slug within SLUG_MAX including the random suffix", () => {
    const slug = generateSlug("x".repeat(200));
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX);
  });
});

describe("slugSchema", () => {
  it("accepts a normal lowercase slug", () => {
    expect(slugSchema.safeParse("acme-support").success).toBe(true);
    expect(slugSchema.safeParse("boostk-9f2c").success).toBe(true);
  });

  it("rejects uppercase, spaces, and non-slug characters", () => {
    expect(slugSchema.safeParse("Boostk").success).toBe(false);
    expect(slugSchema.safeParse("acme support").success).toBe(false);
    expect(slugSchema.safeParse("acme_support").success).toBe(false);
  });

  it("rejects slugs that are only hyphens", () => {
    expect(slugSchema.safeParse("-").success).toBe(false);
    expect(slugSchema.safeParse("--").success).toBe(false);
  });

  it("rejects slugs over the max length", () => {
    expect(slugSchema.safeParse("a".repeat(SLUG_MAX + 1)).success).toBe(false);
    expect(slugSchema.safeParse("a".repeat(SLUG_MAX)).success).toBe(true);
  });

  it("rejects reserved route words", () => {
    for (const reserved of ["manifest", "chat-widget", "chat", "settings", "tickets"]) {
      expect(slugSchema.safeParse(reserved).success).toBe(false);
      expect(RESERVED_SLUGS.has(reserved)).toBe(true);
    }
  });
});
