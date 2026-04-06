import { queryOptions } from "@tanstack/react-query";
import { getCustomerTicketMessagesFn, getTicketMessagesFn } from "@/modules/ticket-message/ticket-message.functions";

export const ticketMessageQueries = {
  all: ["ticket-messages"],
  getTicketMessages: (ticketId: string) =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, ticketId],
      queryFn: () => getTicketMessagesFn({ data: ticketId }),
      enabled: !!ticketId,
    }),
  getCustomerTicketMessages: () =>
    queryOptions({
      queryKey: [...ticketMessageQueries.all, "customer"],
      queryFn: () => getCustomerTicketMessagesFn(),
    }),
};
