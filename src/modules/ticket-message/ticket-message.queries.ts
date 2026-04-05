import { queryOptions } from "@tanstack/react-query";
import { getTicketMessagesFn } from "./ticket-message.functions";

export const ticketMessageQueries = {
  all: ["ticket-messages"],
  getTicketMessages: () =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all],
      queryFn: () => getTicketMessagesFn(),
    }),
};
