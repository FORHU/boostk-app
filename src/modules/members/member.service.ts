import { z } from "zod";
import { ORG_ROLE } from "@/modules/auth/roles";

/**
 * Roles an admin may assign through the UI.
 *
 * `owner` is deliberately absent: it is reserved for the org creator and is not
 * transferable from the members table. Keeping the list here rather than inline in the
 * validator is what lets a test assert the omission — a regression that re-added `owner`
 * would otherwise only surface as a privilege-escalation bug in production.
 */
export const ASSIGNABLE_ROLES = [ORG_ROLE.MEMBER, ORG_ROLE.AGENT, ORG_ROLE.ADMIN] as const;

export const assignableRoleSchema = z.enum(ASSIGNABLE_ROLES);

/** The subset of a member row these guards actually read. */
type MemberLike = { organizationId: string; role: string };

/**
 * The two checks every member mutation has to pass before touching a row.
 *
 * Extracted from the server-function handlers so it can be tested directly: the handlers
 * themselves are wrapped by `createServerFn` middleware and are not callable in a unit
 * test, which is how these guards went untested while carrying the whole weight of
 * cross-tenant and owner protection.
 *
 * Both failures throw rather than returning a flag, so a caller that forgets to check the
 * result cannot silently proceed.
 *
 * @param member  the row as loaded, or null when the id matched nothing
 * @param organizationId  the org resolved from the caller's own middleware context —
 *   never one supplied by the request body
 */
export const assertMemberMutable = (
  member: MemberLike | null,
  organizationId: string,
  action: "update" | "remove",
): void => {
  // A member from another organization is reported as "not found" rather than
  // "forbidden": an admin of org A should not be able to probe whether a given member id
  // exists in org B.
  if (!member || member.organizationId !== organizationId) {
    throw new Error("Member not found or does not belong to this organization.");
  }

  if (member.role === ORG_ROLE.OWNER) {
    throw new Error(
      action === "remove"
        ? "The organization owner cannot be removed."
        : "The organization owner's role cannot be changed.",
    );
  }
};
