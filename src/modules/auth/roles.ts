// Organization roles, ordered from most to least privileged:
//   owner  — org creator; full control (Better Auth assigns this on org creation)
//   admin  — manages the org: Teams, Billing, Settings
//   agent  — human support staff; works the inbox (tickets/chat) but not org admin pages
//   member — base tier; no inbox access
// `role` is stored as a free string on the `members` table (default "member"),
// so everything here treats unknown/legacy values (e.g. seed's "user") as the lowest tier.
export const ORG_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  AGENT: "agent",
  MEMBER: "member",
} as const;

export type OrgRole = (typeof ORG_ROLE)[keyof typeof ORG_ROLE];

const ROLE_RANK: Record<OrgRole, number> = {
  [ORG_ROLE.OWNER]: 4,
  [ORG_ROLE.ADMIN]: 3,
  [ORG_ROLE.AGENT]: 2,
  [ORG_ROLE.MEMBER]: 1,
};

/** Coerce a stored role string into a known OrgRole, defaulting to MEMBER. */
export function normalizeRole(role: string | null | undefined): OrgRole {
  if (role === ORG_ROLE.OWNER || role === ORG_ROLE.ADMIN || role === ORG_ROLE.AGENT) return role;
  return ORG_ROLE.MEMBER;
}

/** Resolve a user's role within a set of organization members, or null if not a member. */
export function getMemberRole(members: Array<{ userId: string; role: string | null }>, userId: string): OrgRole | null {
  const member = members.find((m) => m.userId === userId);
  if (!member) return null;
  return normalizeRole(member.role);
}

/** True when `role` meets or exceeds `minRole`. A null/absent role never satisfies a requirement. */
export function hasOrgRole(role: string | null | undefined, minRole: OrgRole): boolean {
  if (role == null) return false;
  return ROLE_RANK[normalizeRole(role)] >= ROLE_RANK[minRole];
}

// ---------------------------------------------------------------------------
// Platform roles — a tier ABOVE organizations.
//
// Deliberately kept separate from OrgRole rather than extended onto the ranking
// above: org roles answer "what may this user do inside org X", platform roles
// answer "may this user act across every org at once". Collapsing them into one
// ladder would make `hasOrgRole(role, OWNER)` silently grant cross-tenant reach
// the moment a platform value leaked into a `members.role` column.
//
// `platformRole` is stored as a nullable free string on `users`. Null — the
// value for essentially every user — means no platform authority whatsoever.
//   staff — BOOSTK team; works the global triage inbox, routes intake chats to
//           an organization + project. Grants NO authority inside any org.
// ---------------------------------------------------------------------------
export const PLATFORM_ROLE = {
  STAFF: "staff",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLE)[keyof typeof PLATFORM_ROLE];

/**
 * True when the user holds platform staff authority. Unknown/legacy strings are
 * rejected rather than coerced: an unrecognised value must never be read as
 * cross-tenant access. This is the inverse of `normalizeRole`'s forgiving
 * default, and intentionally so.
 */
export function hasPlatformRole(platformRole: string | null | undefined): boolean {
  return platformRole === PLATFORM_ROLE.STAFF;
}
