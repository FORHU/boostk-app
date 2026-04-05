import { queryOptions } from "@tanstack/react-query";
import { getProjectTicketsFn } from "@/modules/ticket/ticket.functions";

export const ticketQueries = {
  all: ["tickets"],
  getProjectTickets: (projectId: string) =>
    queryOptions({
      queryKey: [...ticketQueries.all, "project", projectId],
      queryFn: () => getProjectTicketsFn({ data: { projectId } }),
    }),
};
