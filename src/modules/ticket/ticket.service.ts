import { prisma } from "prisma/db";

export const TicketService = {
  async getTicketById(ticketId: string) {
    return await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
  },
};
