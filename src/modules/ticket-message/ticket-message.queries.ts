import { queryOptions } from "@tanstack/react-query";
import { getTicketMessagesByTicketFn, getTicketMessagesFn } from "./ticket-message.functions";

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
    }),
};
