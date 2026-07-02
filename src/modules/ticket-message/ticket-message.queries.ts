import { queryOptions } from "@tanstack/react-query";
import { getTicketMessagesByTicketFn, getTicketMessagesFn } from "./ticket-message.functions";

export const ticketMessageQueries = {
  all: ["ticket-messages"],
  getTicketMessages: () =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all],
      queryFn: () => getTicketMessagesFn(),
    }),
  getByTicket: (ticketId: string) =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, "ticket", ticketId],
      queryFn: () => getTicketMessagesByTicketFn({ data: { ticketId } }),
    }),
};
