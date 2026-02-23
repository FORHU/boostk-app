import { prisma } from "prisma/db";
import type { SenderType } from "prisma/generated/client";
import { EventType } from "@/notifier/core";
import { getNotifier } from "@/notifier/impl";

export type NonSystemSenderType = Exclude<SenderType, "SYSTEM">;

export const MessageService = {
  async createMessage(data: { ticketId: string; content: string; senderId: string; senderType: NonSystemSenderType }) {
    // 1. Fetch ticket and customer to understand language preferences
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: { customer: true },
    });

    if (!ticket) {
      throw new Error(`Ticket ${data.ticketId} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerMetadata = ticket.customer.metadata as Record<string, unknown>;
    // 1. Cast the metadata value to a string or fallback to "en"
    const browserLanguage =
      typeof customerMetadata?.browserLanguage === "string" ? customerMetadata.browserLanguage : "en";

    // 2. Explicitly type your variables if you want to be extra safe
    let sourceLang: string = browserLanguage;
    let targetLang: string = "en";

    if (data.senderType === "AGENT") {
      sourceLang = "en";
      targetLang = browserLanguage;
    }

    // 2. Create the message instantly
    const newMessage = await prisma.message.create({
      data: {
        ticketId: data.ticketId,
        content: data.content,
        senderId: data.senderId,
        senderType: data.senderType,
        sourceLang: sourceLang,
        targetLang: targetLang,
      },
    });

    // 3. Conditionally fetch the sender based on the senderType
    let senderDetails = null;

    if (data.senderType === "AGENT") {
      // Fetch Agent (User) details.
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

    // 4. Combine the message with the fetched sender details
    const messageWithSender = {
      ...newMessage,
      sender: senderDetails,
    };

    // 5. Broadcast instantly to make it feel fast
    getNotifier().onBroadcast(`ticket_${data.ticketId}`, messageWithSender, EventType.CHAT_MESSAGE);

    // 6. Asynchronously handle the translation if needed
    if (sourceLang !== targetLang) {
      // Run this asynchronously without awaiting so we don't block the API response
      (async () => {
        try {
          // Fetch previous messages for context
          const previousMessagesData = await prisma.message.findMany({
            where: { ticketId: data.ticketId, id: { not: newMessage.id } }, // Exclude the message we just created
            orderBy: { createdAt: "desc" },
            take: 5,
          });

          // Format for webhook (oldest first)
          const previousMessages = previousMessagesData.reverse().map((msg) => ({
            role: msg.senderType === "CUSTOMER" ? "customer" : "agent",
            original: msg.content,
            translated: msg.translatedContent || msg.content,
          }));

          const webhookPayload = {
            previousMessages,
            role: data.senderType === "CUSTOMER" ? "customer" : "agent",
            content: data.content,
            sourceLang,
            targetLang,
          };

          const response = await fetch("https://nmai.app.n8n.cloud/webhook/bdbfd969-ea94-4bb1-b9c8-16c7cb5cbcf7", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
          });

          if (response.ok) {
            const result = await response.json();

            // Check if n8n returned a specific error payload (e.g. { error: { message: ... } })
            if (result?.error) {
              console.error("Translation webhook returned an error payload:", result.error);
              throw new Error("Webhook payload contained an error");
            }

            if (result?.translated) {
              // Update the message in DB
              const updatedMessage = await prisma.message.update({
                where: { id: newMessage.id },
                data: {
                  translatedContent: result.translation,
                  sourceLang: result.source_language || sourceLang,
                  targetLang: result.target_language || targetLang,
                },
              });

              // Re-broadcast the updated message
              const updatedMessageWithSender = {
                ...updatedMessage,
                sender: senderDetails,
              };

              getNotifier().onBroadcast(`ticket_${data.ticketId}`, updatedMessageWithSender, EventType.CHAT_MESSAGE);
            }
          } else {
            console.error("Translation webhook failed with status", response.status);
            throw new Error(`Webhook failed with status ${response.status}`);
          }
        } catch (error) {
          console.error("Failed to process background translation:", error);

          try {
            // Update the message in DB with the error keyword
            const updatedMessage = await prisma.message.update({
              where: { id: newMessage.id },
              data: {
                translatedContent: "__TRANSLATION_ERROR__",
              },
            });

            const updatedMessageWithSender = {
              ...updatedMessage,
              sender: senderDetails,
            };

            // Broadcast the error state so the UI can update
            getNotifier().onBroadcast(`ticket_${data.ticketId}`, updatedMessageWithSender, EventType.CHAT_MESSAGE);
          } catch (dbError) {
            console.error("Failed to save translation error state to DB:", dbError);
          }
        }
      })();
    }

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

    let nextCursor: string | undefined = undefined;
    if (messages.length === take) {
      nextCursor = messages[messages.length - 1].id;
    }

    return {
      messages,
      nextCursor,
    };
  },
};
