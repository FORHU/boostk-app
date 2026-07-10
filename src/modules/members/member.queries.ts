import { queryOptions } from "@tanstack/react-query";
import { getAdminOrgMembersFn, getAgentProjectMembersFn } from "./member.functions";

export const memberQueries = {
  members: ["members"],

  adminAllByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "admin", organizationId],
      queryFn: () => getAdminOrgMembersFn({ data: { organizationId } }),
    }),

  agentAllByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "agent", organizationId],
      queryFn: () => getAgentProjectMembersFn({ data: { organizationId } }),
    }),
};
