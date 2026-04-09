import { createAccessControl } from "better-auth/plugins/access";

const statement = {} as const;

export const accessControl = createAccessControl(statement);
