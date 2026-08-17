import { describe, expect, it } from "vitest";
import { ORG_ROLE } from "@/modules/auth/roles";
import { ASSIGNABLE_ROLES, assertMemberMutable, assignableRoleSchema } from "./member.service";

const ORG = "org_1";
const memberOf = (organizationId: string, role: string) => ({ organizationId, role });

describe("assignableRoleSchema", () => {
  it("accepts the three roles an admin may hand out", () => {
    for (const role of [ORG_ROLE.MEMBER, ORG_ROLE.AGENT, ORG_ROLE.ADMIN]) {
      expect(assignableRoleSchema.safeParse(role).success).toBe(true);
    }
  });

  // The whole point of the enum: an admin must not be able to mint another owner, which
  // would be a straight privilege escalation.
  it("rejects owner", () => {
    expect(assignableRoleSchema.safeParse(ORG_ROLE.OWNER).success).toBe(false);
    expect(ASSIGNABLE_ROLES).not.toContain(ORG_ROLE.OWNER);
  });

  it("rejects unknown roles rather than coercing them", () => {
    for (const role of ["superadmin", "OWNER", "Admin", "", "member "]) {
      expect(assignableRoleSchema.safeParse(role).success).toBe(false);
    }
  });
});

describe("assertMemberMutable", () => {
  it("allows a normal member of the caller's own organization", () => {
    expect(() => assertMemberMutable(memberOf(ORG, ORG_ROLE.MEMBER), ORG, "update")).not.toThrow();
    expect(() => assertMemberMutable(memberOf(ORG, ORG_ROLE.AGENT), ORG, "remove")).not.toThrow();
  });

  it("allows one admin to act on another", () => {
    expect(() => assertMemberMutable(memberOf(ORG, ORG_ROLE.ADMIN), ORG, "update")).not.toThrow();
  });

  it("rejects a member id that matched nothing", () => {
    expect(() => assertMemberMutable(null, ORG, "update")).toThrow(/not found or does not belong/i);
  });

  // Cross-tenant guard. The id is real, just not this admin's to touch.
  it("rejects a member belonging to a different organization", () => {
    expect(() => assertMemberMutable(memberOf("org_2", ORG_ROLE.MEMBER), ORG, "remove")).toThrow(
      /not found or does not belong/i,
    );
  });

  // Deliberately identical to the missing-member message: an admin of org A must not be
  // able to tell "no such member" apart from "member exists, but in org B".
  it("does not distinguish a foreign member from a missing one", () => {
    const foreign = (() => {
      try {
        assertMemberMutable(memberOf("org_2", ORG_ROLE.MEMBER), ORG, "update");
      } catch (e) {
        return (e as Error).message;
      }
    })();
    const missing = (() => {
      try {
        assertMemberMutable(null, ORG, "update");
      } catch (e) {
        return (e as Error).message;
      }
    })();

    expect(foreign).toBe(missing);
  });

  it("protects the owner from a role change", () => {
    expect(() => assertMemberMutable(memberOf(ORG, ORG_ROLE.OWNER), ORG, "update")).toThrow(
      /owner's role cannot be changed/i,
    );
  });

  it("protects the owner from removal", () => {
    expect(() => assertMemberMutable(memberOf(ORG, ORG_ROLE.OWNER), ORG, "remove")).toThrow(/owner cannot be removed/i);
  });

  // Ordering matters: a foreign owner must fail the tenancy check, not leak the fact that
  // the row happens to be an owner.
  it("checks tenancy before ownership", () => {
    expect(() => assertMemberMutable(memberOf("org_2", ORG_ROLE.OWNER), ORG, "remove")).toThrow(
      /not found or does not belong/i,
    );
  });
});
