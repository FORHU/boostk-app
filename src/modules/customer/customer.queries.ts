import { queryOptions } from "@tanstack/react-query";
import { getCustomerThreadFn, getProjectCustomerStatsFn, getProjectCustomersFn } from "./customer.functions";
import type { ProjectCustomerSummary } from "./customer.schema";

export type ProjectCustomerListPage = {
  customers: ProjectCustomerSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export type ProjectCustomerListParams = { projectId: string; search?: string; page?: number; pageSize?: number };

export const projectCustomerQueries = {
  customers: ["project-customers"],
  listPrefix: (projectId: string) => [...projectCustomerQueries.customers, projectId],
  list: ({ projectId, search, page, pageSize }: ProjectCustomerListParams) =>
    queryOptions({
      queryKey: [
        ...projectCustomerQueries.listPrefix(projectId),
        "list",
        { search: search?.trim() ?? "", page: page ?? 1, pageSize: pageSize ?? 8 },
      ],
      queryFn: () => getProjectCustomersFn({ data: { projectId, search, page: page ?? 1, pageSize: pageSize ?? 8 } }),
    }),
  thread: (projectId: string, customerId: string) =>
    queryOptions({
      queryKey: [...projectCustomerQueries.listPrefix(projectId), "thread", customerId],
      queryFn: () => getCustomerThreadFn({ data: { projectId, customerId } }),
      // Short window so switching customers renders the cached thread instantly.
      staleTime: 15_000,
    }),
  stats: (projectId: string) =>
    queryOptions({
      queryKey: [...projectCustomerQueries.listPrefix(projectId), "stats"],
      queryFn: () => getProjectCustomerStatsFn({ data: { projectId } }),
      staleTime: 30_000,
    }),
};
