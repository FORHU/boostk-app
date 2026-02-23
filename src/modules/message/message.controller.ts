import { Elysia, t } from "elysia";
import { z } from "zod";
import { MessageService } from "./message.service";

const messageBodySchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  content: z.string().min(1, "Content is required"),
  senderId: z.string(),
  senderType: z.enum(["CUSTOMER", "AGENT"]),
});

export const messageController = new Elysia({ prefix: "/messages" })
  .post(
    "/",
    async ({ body }) => {
      return MessageService.createMessage({
        ticketId: body.ticketId,
        content: body.content,
        senderId: body.senderId,
        senderType: body.senderType,
      });
    },
    {
      body: messageBodySchema,
      detail: { tags: ["Message"], summary: "Send a message to a ticket" },
    },
  )
  .get(
    "/ticket/:ticketId",
    ({ params: { ticketId }, query: { cursor } }) => {
      return MessageService.getHistory(ticketId, cursor);
    },
    {
      query: t.Object({
        cursor: t.Optional(t.String()),
      }),
      detail: { tags: ["Message"], summary: "Get message history for a ticket" },
    },
  );
