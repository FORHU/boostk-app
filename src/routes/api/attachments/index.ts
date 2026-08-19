import { createFileRoute } from "@tanstack/react-router";
import { rateLimitedResponse } from "@/lib/rate-limit";
import { allowAttachmentUpload } from "@/modules/attachment/attachment.rate-limit";
import { UploadAttachmentSchema } from "@/modules/attachment/attachment.schema";
import {
  assertAttachmentQuota,
  resolveAttachmentAccess,
  storeAttachment,
  validateAttachment,
} from "@/modules/attachment/attachment.service";

// Upload a chat attachment: multipart POST /api/attachments
//   fields: file, ticketId, projectId
//   -> { id, url, filename, mimeType, size, contentType }
//
// A plain REST route rather than a server function because server functions are RPC
// over JSON and cannot stream a multipart body. Both the customer widget and the agent
// inbox post here; resolveAttachmentAccess decides which one is calling.
//
// Uploading only stores the file — it does not post a message. The client sends the
// returned url as the message `content` in a second call.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/attachments/")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ error: "Expected a multipart form body" }, 400);
        }

        const parsed = UploadAttachmentSchema.safeParse({
          ticketId: form.get("ticketId"),
          projectId: form.get("projectId"),
        });
        if (!parsed.success) return json({ error: "Missing ticketId or projectId" }, 400);

        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Missing file" }, 400);

        const invalid = validateAttachment(file);
        if (invalid) return json({ error: invalid.error }, invalid.status);

        const actor = await resolveAttachmentAccess(request, parsed.data.ticketId, parsed.data.projectId);
        if (!actor) return json({ error: "Not allowed to upload to this ticket" }, 403);

        // Throttling comes AFTER authorisation, never before: keyed on the ticket, an
        // unauthorised caller who could spend the budget first would be able to lock a
        // stranger's conversation out of uploading by naming its id.
        //
        // Customers only. Agents reach this route from the inbox behind `requireAuth`,
        // are accountable by name, and legitimately attach batches of files; the surface
        // this task is closing is the anonymous one. Note that the per-ticket quota below
        // still counts *every* attachment on the ticket, agent-sent included, because it
        // bounds what the conversation costs rather than who sent it.
        if (actor.kind === "customer") {
          const verdict = allowAttachmentUpload(parsed.data.ticketId);
          if (!verdict.allowed) {
            return rateLimitedResponse(verdict.retryAfterSeconds, "You're uploading files too quickly.");
          }

          const overQuota = await assertAttachmentQuota(parsed.data.ticketId, file.size);
          if (overQuota) return json({ error: overQuota.error }, overQuota.status);
        }

        try {
          return json(await storeAttachment(file, parsed.data.ticketId), 201);
        } catch (err) {
          return json({ error: (err as Error).message }, 500);
        }
      },
    },
  },
});
