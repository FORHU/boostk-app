import type { Prisma } from "prisma/generated/client";

export type TicketWithCustomer = Prisma.TicketGetPayload<{
  include: {
    customer: true;
  };
}>;
