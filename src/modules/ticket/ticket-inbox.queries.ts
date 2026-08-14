import type { InfiniteData } from "@tanstack/react-query";
import { getProjectTicketInboxFn } from "./ticket.functions";
import type { ProjectTicketInboxPage, TicketInboxScope } from "./ticket.schema";

export type ProjectTicketInboxListParams = {
  projectId: string;
  statusFilter?: "ALL" | "OPEN" | "CLOSED";
  scope?: TicketInboxScope;
  search?: string;
  take?: number;
};

// Not wrapped in queryOptions: `list` feeds `useInfiniteQuery`, and queryOptions
// only models regular useQuery options (same pattern as projectCustomerQueries).
export const ticketInboxQueries = {
  tickets: ["ticket-inbox"],
  listPrefix: (projectId: string) => [...ticketInboxQueries.tickets, projectId],
  list: ({ projectId, statusFilter = "ALL", scope = "ALL", search, take = 15 }: ProjectTicketInboxListParams) => ({
    queryKey: [
      ...ticketInboxQueries.listPrefix(projectId),
      "list",
      { statusFilter, scope, search: search?.trim() ?? "", take },
    ],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getProjectTicketInboxFn({ data: { projectId, statusFilter, scope, search, take, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ProjectTicketInboxPage) => lastPage.nextCursor,
    // Keep the current rows on screen while a search/filter change refetches, so
    // the sidebar doesn't flash a loading skeleton between queries.
    placeholderData: (prev: InfiniteData<ProjectTicketInboxPage, string | undefined> | undefined) => prev,
  }),
};
