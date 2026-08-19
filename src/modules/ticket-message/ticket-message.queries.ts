import { queryOptions } from "@tanstack/react-query";
import { getAgentConversationsFn, getTicketMessagesByTicketFn, getTicketMessagesFn } from "./ticket-message.functions";

export const ticketMessageQueries = {
  all: ["ticket-messages"],
  getTicketMessages: (projectId: string) =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, projectId],
      queryFn: () => getTicketMessagesFn({ data: { projectId } }),
    }),
  getByTicket: (ticketId: string) =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, "ticket", ticketId],
      queryFn: () => getTicketMessagesByTicketFn({ data: { ticketId } }),
      // Short window so switching between tickets (and back) renders the cached
      // conversation instantly instead of flashing the loading spinner.
      staleTime: 15_000,
    }),
  getAgentConversations: (projectId: string, userId: string) =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, "agent-conversations", projectId, userId],
      queryFn: () => getAgentConversationsFn({ data: { projectId, userId } }),
    }),
};
