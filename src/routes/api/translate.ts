import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { detectLanguage, getSessionId, translateText } from "@/modules/translation/forhu-chat";

// Plain REST endpoint for testing the forhu translation layer in Postman/cURL.
// POST /api/translate  { "text": "...", "targetLang": "English", "detect": true }
// (Server functions are RPC and awkward to call directly; this wraps the same client.)
const BodySchema = z.object({
  text: z.string().min(1),
  targetLang: z.string().default("English"),
  detect: z.boolean().optional(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const parsed = BodySchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) {
            return json({ error: "Invalid body", issues: parsed.error.issues }, 400);
          }
          const { text, targetLang, detect } = parsed.data;

          const sessionId = await getSessionId("api-translate");
          const [translation, detectedLanguage] = await Promise.all([
            translateText(text, targetLang, sessionId),
            detect ? detectLanguage(text, sessionId) : Promise.resolve(undefined),
          ]);

          return json({ text, targetLang, translation, detectedLanguage });
        } catch (err) {
          return json({ error: (err as Error).message }, 502);
        }
      },
    },
  },
});
