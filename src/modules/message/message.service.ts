import { prisma } from "prisma/db";
import type { SenderType } from "prisma/generated/client";
import { EventType } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";

export type NonSystemSenderType = Exclude<SenderType, "SYSTEM">;

export const MessageService = {
  async createMessage(data: { ticketId: string; content: string; senderId: string; senderType: NonSystemSenderType }) {
    // 1. Create the message (without the invalid include)
    const newMessage = await prisma.message.create({
      data: {
        ticketId: data.ticketId,
        content: data.content,
        senderId: data.senderId,
        senderType: data.senderType,
      },
    });

    // 2. Conditionally fetch the sender based on the senderType
    let senderDetails = null;

    if (data.senderType === "AGENT") {
      // Fetch Agent (User) details.
      // Using select to avoid returning sensitive fields like tokens or passwords.
      senderDetails = await prisma.user.findUnique({
        where: { id: data.senderId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } else if (data.senderType === "CUSTOMER") {
      // Fetch Customer details
      senderDetails = await prisma.customer.findUnique({
        where: { id: data.senderId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // 3. Combine the message with the fetched sender details
    const messageWithSender = {
      ...newMessage,
      sender: senderDetails,
    };

    // 4. Broadcast and return the enriched message
    getNotifier().onBroadcast(`ticket_${data.ticketId}`, messageWithSender, EventType.CHAT_MESSAGE);

    return messageWithSender;
  },

  async createSystemMessage(data: { ticketId: string; content: string }) {
    const newMessage = await prisma.message.create({
      data: {
        ticketId: data.ticketId,
        content: data.content,
        senderId: "SYSTEM",
        senderType: "SYSTEM",
      },
      include: {
        ticket: true,
      },
    });

    getNotifier().onBroadcast(`ticket_${newMessage.ticketId}`, newMessage, EventType.CHAT_MESSAGE);

    return newMessage;
  },

  async getHistory(ticketId: string, cursor?: string, take: number = 20) {
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    // We want the frontend to display chronologically, so we reverse the descending list
    const reversedMessages = messages.reverse();

    let nextCursor: string | undefined = undefined;
    if (messages.length === take) {
      nextCursor = reversedMessages[0].id;
    }

    return {
      messages: reversedMessages,
      nextCursor,
    };
  },
};
