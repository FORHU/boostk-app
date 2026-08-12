import { createRateLimiter } from "@/lib/rate-limit";
import { ATTACHMENT_UPLOAD_WINDOW_MS, ATTACHMENT_UPLOADS_PER_WINDOW } from "./attachment.schema";

/**
 * Burst limit on `POST /api/attachments`, keyed on the ticket.
 *
 * Per ticket rather than per client on purpose: the upload route already proved the
 * caller may write to this conversation, and the thing worth protecting is the
 * conversation's footprint — which is what `Attachment.bytes` costs the database.
 *
 * This is the fast half of the pair. It shapes traffic but resets, so it cannot cap a
 * patient uploader; `assertAttachmentQuota` in `attachment.service.ts` counts the rows
 * that are actually there and is the durable ceiling. See `ATTACHMENT_MAX_PER_TICKET`.
 */
const uploadLimiter = createRateLimiter({
  limit: ATTACHMENT_UPLOADS_PER_WINDOW,
  windowMs: ATTACHMENT_UPLOAD_WINDOW_MS,
});

/** Whether this conversation may upload another file right now. */
export const allowAttachmentUpload = (ticketId: string) => uploadLimiter.check(ticketId);

/** Test seam — resets the in-memory windows. */
export function __resetAttachmentRateLimits() {
  uploadLimiter.reset();
}
