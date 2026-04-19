import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  project: ["create", "read", "update", "delete"],
} as const;

export const accessControl = createAccessControl(statement);

export const admin = accessControl.newRole({
  project: ["create", "read", "update", "delete"],
  ...adminAc.statements,
});

export const user = accessControl.newRole({
  project: ["read"],
});
