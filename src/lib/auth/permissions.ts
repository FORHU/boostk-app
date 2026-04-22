import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

export const accessControl = createAccessControl(statement);

export const admin = accessControl.newRole({
  ...adminAc.statements,
});

export const user = accessControl.newRole({
  ...userAc.statements,
});
