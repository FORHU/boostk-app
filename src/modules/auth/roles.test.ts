import { describe, expect, it } from "vitest";
import { getMemberRole, hasOrgRole, normalizeRole, ORG_ROLE } from "./roles";

describe("normalizeRole", () => {
  it("passes known roles through unchanged", () => {
    expect(normalizeRole(ORG_ROLE.OWNER)).toBe(ORG_ROLE.OWNER);
    expect(normalizeRole(ORG_ROLE.ADMIN)).toBe(ORG_ROLE.ADMIN);
    expect(normalizeRole(ORG_ROLE.AGENT)).toBe(ORG_ROLE.AGENT);
    expect(normalizeRole(ORG_ROLE.MEMBER)).toBe(ORG_ROLE.MEMBER);
  });

  it("defaults legacy/unknown role strings to member", () => {
    expect(normalizeRole("user")).toBe(ORG_ROLE.MEMBER);
    expect(normalizeRole("")).toBe(ORG_ROLE.MEMBER);
    expect(normalizeRole("root")).toBe(ORG_ROLE.MEMBER);
    expect(normalizeRole("super-admin")).toBe(ORG_ROLE.MEMBER);
  });

  it("defaults null and undefined to member", () => {
    expect(normalizeRole(null)).toBe(ORG_ROLE.MEMBER);
    expect(normalizeRole(undefined)).toBe(ORG_ROLE.MEMBER);
  });
});

describe("getMemberRole", () => {
  const members = [
    { userId: "u-owner", role: "owner" },
    { userId: "u-legacy", role: "user" },
    { userId: "u-null", role: null },
    { userId: "u-admin", role: "admin" },
  ];

  it("returns null when the user is not a member", () => {
    expect(getMemberRole(members, "u-unknown")).toBeNull();
  });

  it("returns null for an empty members list", () => {
    expect(getMemberRole([], "u-owner")).toBeNull();
  });

  it("returns the matching member's role", () => {
    expect(getMemberRole(members, "u-owner")).toBe(ORG_ROLE.OWNER);
    expect(getMemberRole(members, "u-admin")).toBe(ORG_ROLE.ADMIN);
  });

  it("normalizes legacy role strings to member", () => {
    expect(getMemberRole(members, "u-legacy")).toBe(ORG_ROLE.MEMBER);
  });

  it("treats a member with a null role as member", () => {
    expect(getMemberRole(members, "u-null")).toBe(ORG_ROLE.MEMBER);
  });
});

describe("hasOrgRole", () => {
  it("returns false for null and undefined roles even at the member tier", () => {
    expect(hasOrgRole(null, ORG_ROLE.MEMBER)).toBe(false);
    expect(hasOrgRole(undefined, ORG_ROLE.MEMBER)).toBe(false);
  });

  it("allows owner to clear every requirement", () => {
    for (const min of [ORG_ROLE.OWNER, ORG_ROLE.ADMIN, ORG_ROLE.AGENT, ORG_ROLE.MEMBER]) {
      expect(hasOrgRole(ORG_ROLE.OWNER, min)).toBe(true);
    }
  });

  it("allows admin to clear admin and below, but not owner", () => {
    expect(hasOrgRole(ORG_ROLE.ADMIN, ORG_ROLE.OWNER)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.ADMIN, ORG_ROLE.ADMIN)).toBe(true);
    expect(hasOrgRole(ORG_ROLE.ADMIN, ORG_ROLE.AGENT)).toBe(true);
    expect(hasOrgRole(ORG_ROLE.ADMIN, ORG_ROLE.MEMBER)).toBe(true);
  });

  it("allows agent to clear agent and member, but not admin", () => {
    expect(hasOrgRole(ORG_ROLE.AGENT, ORG_ROLE.OWNER)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.AGENT, ORG_ROLE.ADMIN)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.AGENT, ORG_ROLE.AGENT)).toBe(true);
    expect(hasOrgRole(ORG_ROLE.AGENT, ORG_ROLE.MEMBER)).toBe(true);
  });

  it("allows member to clear only the member requirement", () => {
    expect(hasOrgRole(ORG_ROLE.MEMBER, ORG_ROLE.OWNER)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.MEMBER, ORG_ROLE.ADMIN)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.MEMBER, ORG_ROLE.AGENT)).toBe(false);
    expect(hasOrgRole(ORG_ROLE.MEMBER, ORG_ROLE.MEMBER)).toBe(true);
  });

  it("treats legacy/unknown role strings as the member tier", () => {
    expect(hasOrgRole("user", ORG_ROLE.MEMBER)).toBe(true);
    expect(hasOrgRole("user", ORG_ROLE.AGENT)).toBe(false);
    expect(hasOrgRole("root", ORG_ROLE.MEMBER)).toBe(true);
  });
});
