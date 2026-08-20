import { describe, expect, it } from "vitest";
import { createProjectSchema, getProjectSchema, getPublicProjectSchema, updateProjectSchema } from "./project.schema";
import { toPublicProject } from "./project.service";

/** A full project row, as `getProjectBySlug` returns it. */
const projectRow = {
  id: "proj_1",
  name: "Acme Support",
  description: "Customer support for Acme",
  logo: null,
  slug: "acme-support-9f2c",
  organizationId: "org_secret",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-02-02"),
};

describe("toPublicProject", () => {
  it("returns exactly the four public fields", () => {
    expect(Object.keys(toPublicProject(projectRow)).sort()).toEqual(["description", "id", "logo", "name"]);
  });

  it("carries those four values through unchanged", () => {
    expect(toPublicProject(projectRow)).toEqual({
      id: "proj_1",
      name: "Acme Support",
      description: "Customer support for Acme",
      logo: null,
    });
  });

  // `getProjectPublicFn` has no auth middleware — anyone with a project id or slug can
  // call it — so these are the fields that must never reach an anonymous visitor.
  it("does not leak tenancy or internal columns", () => {
    const publicProject = toPublicProject(projectRow) as Record<string, unknown>;

    for (const leaked of ["organizationId", "slug", "createdAt", "updatedAt"]) {
      expect(publicProject).not.toHaveProperty(leaked);
    }
  });

  // A whitelist that spreads its input would silently start leaking whenever a column is
  // added to the model. Prove it ignores fields it was never told about.
  it("ignores fields added to the row it does not know about", () => {
    const withNewColumn = { ...projectRow, billingEmail: "finance@acme.test", isPrivate: true };

    const publicProject = toPublicProject(withNewColumn) as Record<string, unknown>;

    expect(publicProject).not.toHaveProperty("billingEmail");
    expect(publicProject).not.toHaveProperty("isPrivate");
    expect(Object.keys(publicProject)).toHaveLength(4);
  });

  it("preserves a null logo rather than dropping the key", () => {
    expect(toPublicProject({ ...projectRow, logo: null })).toHaveProperty("logo", null);
    expect(toPublicProject({ ...projectRow, logo: "https://cdn.test/a.png" }).logo).toBe("https://cdn.test/a.png");
  });
});

describe("project schemas", () => {
  it("requires a non-empty name and organization on create", () => {
    expect(createProjectSchema.safeParse({ name: "Acme", organizationId: "org_1" }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: "", organizationId: "org_1" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "Acme", organizationId: "" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "Acme" }).success).toBe(false);
  });

  it("treats logo as optional on create and update", () => {
    expect(createProjectSchema.safeParse({ name: "Acme", organizationId: "org_1" }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ id: "p1", name: "Acme" }).success).toBe(true);
  });

  it("requires an id on update", () => {
    expect(updateProjectSchema.safeParse({ name: "Acme" }).success).toBe(false);
  });

  it("requires a project id on read", () => {
    expect(getProjectSchema.safeParse({ projectId: "proj_1" }).success).toBe(true);
    expect(getProjectSchema.safeParse({ projectId: "" }).success).toBe(false);
    expect(getProjectSchema.safeParse({}).success).toBe(false);
  });

  it("requires a project slug on public read", () => {
    expect(getPublicProjectSchema.safeParse({ projectSlug: "acme-support-9f2c" }).success).toBe(true);
    expect(getPublicProjectSchema.safeParse({ projectSlug: "" }).success).toBe(false);
    expect(getPublicProjectSchema.safeParse({}).success).toBe(false);
  });
});
