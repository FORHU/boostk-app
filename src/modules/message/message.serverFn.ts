import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MessageService } from "./message.service";

export const createMessageFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ticketId: z.string().min(1, "Ticket ID is required"),
      content: z.string().min(1, "Content is required"),
      senderId: z.string(),
      senderType: z.enum(["bot", "user", "agent", "CUSTOMER", "AGENT"]),
      sourceLang: z.string().optional(),
      targetLang: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sender = data.senderType === "user" || data.senderType === "CUSTOMER" ? "CUSTOMER" : "AGENT";
    return MessageService.createMessage({
      ticketId: data.ticketId,
      content: data.content,
      senderId: data.senderId,
      senderType: sender,
    });
  });

export const getMessageHistoryFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      ticketId: z.string(),
      cursor: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return MessageService.getHistory(data.ticketId, data.cursor);
  });
