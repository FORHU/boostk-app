import { queryOptions } from "@tanstack/react-query";
import { getProjectCustomersFn } from "./customer.functions";

export const projectCustomerQueries = {
  customers: ["project-customers"],
  allByProjectId: (projectId: string) =>
    queryOptions({
      queryKey: [...projectCustomerQueries.customers, "all", projectId],
      queryFn: () => getProjectCustomersFn({ data: { projectId } }),
    }),
};
