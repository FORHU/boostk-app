import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ticketId: z.string(),
      content: z.string(),
      sender: z.enum(["bot", "user", "agent"]).optional().default("user"),
      sourceLang: z.string().optional(),
      targetLang: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Plan for translations:
    // 1. Backend receives the new message in `sourceLang`.
    // 2. Call translation service here to get `translatedText` in `targetLang`.
    // 3. Save message entity (with `translatedText` and `originalText`) to DB via Prisma.
    // 4. Return the full saved message so frontend can update its store with the translation.

    return {
      id: `msg-${Date.now()}`,
      ticketId: data.ticketId,
      text: `test message`,
      sender: data.sender,
      timestamp: new Date().toISOString(),
      sourceLang: data.sourceLang,
      targetLang: data.targetLang,
      translatedText: undefined as string | undefined, // To be populated by translation service
    };
  });
