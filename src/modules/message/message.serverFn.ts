import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ticketId: z.string(), content: z.string() }))
  .handler(async ({ data }) => {
    return data;
  });
