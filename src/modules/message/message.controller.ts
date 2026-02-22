// app/controllers/message.controller.ts
import { Elysia, t } from "elysia";
import { MessageService } from "./message.service";

export const messageController = new Elysia({ prefix: "/messages" })
  .post(
    "/",
    async ({ body, user }) => {
      // Determine the sender from the auth context (either an Agent or a Customer)
      // const senderId = user?.id;
      // const senderType = user ? "AGENT" : "CUSTOMER";

      return MessageService.createMessage({
        ticketId: body.ticketId,
        content: body.content,
        senderId,
        senderType,
      });
    },
    {
      body: t.Object({
        ticketId: t.String(),
        content: t.String(),
      }),
      detail: { tags: ["Message"], summary: "Send a message to a ticket" },
    },
  )
  .get(
    "/ticket/:ticketId",
    ({ params: { ticketId } }) => {
      return MessageService.getHistory(ticketId);
    },
    {
      detail: { tags: ["Message"], summary: "Get message history for a ticket" },
    },
  );
