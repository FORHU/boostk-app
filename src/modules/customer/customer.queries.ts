import { queryOptions } from "@tanstack/react-query";
import { getCustomerThreadFn, getProjectCustomersFn } from "./customer.functions";
import type { ProjectCustomerSummary } from "./customer.schema";

export type ProjectCustomerListPage = { customers: ProjectCustomerSummary[]; nextCursor: string | null };
export type ProjectCustomerListParams = { projectId: string; search?: string; take?: number };

export const projectCustomerQueries = {
  customers: ["project-customers"],
  listPrefix: (projectId: string) => [...projectCustomerQueries.customers, projectId],
  // Not wrapped in queryOptions: `list` feeds `useInfiniteQuery`, and this version
  // of queryOptions only models regular useQuery options.
  list: ({ projectId, search, take }: ProjectCustomerListParams) => ({
    queryKey: [
      ...projectCustomerQueries.listPrefix(projectId),
      "list",
      { search: search?.trim() ?? "", take: take ?? 25 },
    ],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getProjectCustomersFn({ data: { projectId, search, take: take ?? 25, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ProjectCustomerListPage) => lastPage.nextCursor,
  }),
  thread: (projectId: string, customerId: string) =>
    queryOptions({
      queryKey: [...projectCustomerQueries.listPrefix(projectId), "thread", customerId],
      queryFn: () => getCustomerThreadFn({ data: { projectId, customerId } }),
      // Short window so switching customers renders the cached thread instantly.
      staleTime: 15_000,
    }),
};
