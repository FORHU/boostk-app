import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { isImageMimeType } from "@/modules/attachment/attachment.schema";
import { resolveAttachmentAccess } from "@/modules/attachment/attachment.service";

// Serve a chat attachment: GET /api/attachments/:id
//
// This is the URL stored in `TicketMessage.content` for IMAGE/FILE messages, so it is
// hit by plain <img src> and <a href> — meaning auth has to ride on cookies alone.
// Access is re-checked per request against the attachment's own ticket; the id being
// unguessable is not treated as authorisation on its own.

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** RFC 5987 encoding so non-ASCII filenames survive the header intact. */
const contentDisposition = (filename: string, inline: boolean) => {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

export const Route = createFileRoute("/api/attachments/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const attachment = await prisma.attachment.findUnique({
          where: { id: params.id },
          select: { filename: true, mimeType: true, size: true, bytes: true, ticketId: true },
        });
        if (!attachment) return json({ error: "Not found" }, 404);

        const actor = await resolveAttachmentAccess(request, attachment.ticketId);
        if (!actor) return json({ error: "Not allowed to view this attachment" }, 403);

        // Images render inline in the bubble; everything else downloads.
        const inline = isImageMimeType(attachment.mimeType);

        return new Response(new Uint8Array(attachment.bytes), {
          status: 200,
          headers: {
            "Content-Type": attachment.mimeType,
            "Content-Length": String(attachment.size),
            "Content-Disposition": contentDisposition(attachment.filename, inline),
            // Bytes are immutable once written, but the response is per-viewer —
            // `private` keeps shared caches out of it.
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
