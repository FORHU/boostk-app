import { queryOptions } from "@tanstack/react-query";
import { getOrgUsageFn } from "./usage.functions";

export const usageQueries = {
  usage: ["usage"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...usageQueries.usage, organizationId],
      queryFn: () => getOrgUsageFn({ data: { organizationId } }),
    }),
};
