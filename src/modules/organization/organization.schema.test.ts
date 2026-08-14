import { describe, expect, it } from "vitest";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.schema";

describe("createOrganizationSchema", () => {
  it("accepts a name on its own", () => {
    expect(createOrganizationSchema.safeParse({ name: "Acme" }).success).toBe(true);
  });

  it("rejects a missing or empty name", () => {
    expect(createOrganizationSchema.safeParse({}).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("reports the message the form renders", () => {
    const result = createOrganizationSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("Name is required");
  });

  it("treats logo as optional", () => {
    expect(createOrganizationSchema.safeParse({ name: "Acme", logo: "https://cdn.test/a.png" }).success).toBe(true);
  });

  // The slug is derived server-side by `generateSlug`, so a caller must not be able to
  // choose one — an accepted `slug` here would let a tenant squat another's URL.
  it("ignores a client-supplied slug rather than adopting it", () => {
    const parsed = createOrganizationSchema.parse({ name: "Acme", slug: "boostk" });

    expect(parsed).not.toHaveProperty("slug");
  });
});

describe("updateOrganizationSchema", () => {
  it("requires the id alongside the name", () => {
    expect(updateOrganizationSchema.safeParse({ id: "org_1", name: "Acme" }).success).toBe(true);
    expect(updateOrganizationSchema.safeParse({ name: "Acme" }).success).toBe(false);
    expect(updateOrganizationSchema.safeParse({ id: "org_1", name: "" }).success).toBe(false);
  });
});
