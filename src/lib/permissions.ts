import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";

// Access control for the organization plugin. We reuse Better Auth's default
// org resources/statements and add a custom `agent` role on top of the built-in
// owner/admin/member so it can be invited and assigned like any other role.
export const ac = createAccessControl(defaultStatements);

// Agent = human support staff. Same base permissions as a member (they work the
// inbox, not org administration); the app's own RBAC (`modules/auth/roles.ts`)
// ranks agent above member for inbox access.
export const agent = ac.newRole(memberAc.statements);

// Reuse Better Auth's built-in roles for the standard tiers.
export const roles = {
  owner: ownerAc,
  admin: adminAc,
  agent,
  member: memberAc,
};
