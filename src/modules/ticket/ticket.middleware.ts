import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { getTicketSession } from "./ticket.service";

export const requireCustomerTicketMiddleware = createMiddleware({ type: "function" }).server(async ({ next, data }) => {
  const result = z.object({ projectId: z.string() }).safeParse(data);
  const ticket = result.success ? await getTicketSession(result.data.projectId) : null;
  console.log("[customerMiddleware] ticket:", ticket?.referenceNumber ?? null); // temporary debug log

  return next({ context: { ticket } });
});
