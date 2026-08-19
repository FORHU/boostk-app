import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getAdminOrgMembersFn, getAgentProjectMembersFn, getOrgAgentsFn } from "./member.functions";

export type MemberListParams = {
  organizationId: string;
  page?: number;
  pageSize?: number;
  role?: "admin" | "agent" | "member";
  search?: string;
};

export const memberQueries = {
  members: ["members"],

  adminPrefix: (organizationId: string) => [...memberQueries.members, "admin", organizationId],
  adminList: ({ organizationId, page = 1, pageSize = 8, role, search }: MemberListParams) =>
    queryOptions({
      queryKey: [
        ...memberQueries.adminPrefix(organizationId),
        "list",
        { page, pageSize, role, search: search?.trim() ?? "" },
      ],
      queryFn: () => getAdminOrgMembersFn({ data: { organizationId, page, pageSize, role, search } }),
      placeholderData: keepPreviousData,
    }),

  agentPrefix: (organizationId: string) => [...memberQueries.members, "agent", organizationId],
  agentList: ({ organizationId, page = 1, pageSize = 8, role, search }: MemberListParams) =>
    queryOptions({
      queryKey: [
        ...memberQueries.agentPrefix(organizationId),
        "list",
        { page, pageSize, role, search: search?.trim() ?? "" },
      ],
      queryFn: () => getAgentProjectMembersFn({ data: { organizationId, page, pageSize, role, search } }),
      placeholderData: keepPreviousData,
    }),

  orgAgents: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, "org-agents", organizationId],
      queryFn: () => getOrgAgentsFn({ data: { organizationId } }),
    }),
};
