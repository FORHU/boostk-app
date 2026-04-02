import { queryOptions } from "@tanstack/react-query";
import { getOrgProjectsFn } from "@/modules/organization/organization.functions";
import { getProjectById } from "@/modules/project/project.service";

export const projectQueries = {
  all: ["projects"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...projectQueries.all, "by-org", organizationId],
      queryFn: () => getOrgProjectsFn({ data: { organizationId } }),
    }),
  byId: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.all, "by-id", id],
      queryFn: () => getProjectById(id),
    }),
};
