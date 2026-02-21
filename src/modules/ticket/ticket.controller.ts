import { Elysia } from "elysia";
import { TicketService } from "./ticket.service";

export const ticketController = new Elysia({ prefix: "/tickets" }).get(
  "/:ticketId",
  ({ params: { ticketId } }) => TicketService.getTicketById(ticketId),
  {
    detail: { tags: ["Ticket"], summary: "Get a single ticket by ID" },
  },
);
