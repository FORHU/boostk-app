import { queryOptions } from "@tanstack/react-query";
import { getOrgProjectsFn } from "@/modules/organization/organization.functions";

export const projectQueries = {
  all: ["projects"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...projectQueries.all, "by-org", organizationId],
      queryFn: () => getOrgProjectsFn({ data: { organizationId } }),
    }),
};
