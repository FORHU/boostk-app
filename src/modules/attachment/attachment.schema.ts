import { z } from "zod";

/**
 * Hard ceiling on a single upload. Attachment bytes live in a Postgres column
 * (see the `Attachment` model), so this is deliberately small — it bounds both the
 * row size and the memory used to buffer the upload on the server.
 */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Ceilings on a *conversation*, not a file.
 *
 * `ATTACHMENT_MAX_BYTES` alone bounds one upload; it says nothing about five hundred of
 * them. Two limits close that, because they fail differently:
 *
 *  - the burst window is in-memory and resets, so it shapes traffic but cannot cap a
 *    patient uploader who waits between batches;
 *  - the per-ticket totals are counted in the database, so they survive restarts and
 *    are the actual ceiling on what one conversation can cost. At the defaults below a
 *    single ticket can hold at most 100MB.
 */
export const ATTACHMENT_UPLOADS_PER_WINDOW = 10;
export const ATTACHMENT_UPLOAD_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const ATTACHMENT_MAX_PER_TICKET = 50;
export const ATTACHMENT_MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Allowed MIME types, as an explicit allowlist rather than a deny-list: anything
 * not named here is rejected. Kept narrow on purpose — a support chat needs
 * screenshots, documents and logs, not executables.
 */
export const ATTACHMENT_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

export const ATTACHMENT_FILE_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/json",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ATTACHMENT_ALLOWED_MIME_TYPES = [...ATTACHMENT_IMAGE_MIME_TYPES, ...ATTACHMENT_FILE_MIME_TYPES] as const;

/** The `accept` attribute for the file picker — mirrors the server allowlist. */
export const ATTACHMENT_ACCEPT = ATTACHMENT_ALLOWED_MIME_TYPES.join(",");

export const isImageMimeType = (mimeType: string): boolean =>
  (ATTACHMENT_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);

export const isAllowedMimeType = (mimeType: string): boolean =>
  (ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);

/**
 * Multipart fields accepted by `POST /api/attachments`. `projectId` is what scopes
 * a customer's ticket cookie, so it is required even though `ticketId` alone would
 * identify the row — see resolveAttachmentAccess.
 */
export const UploadAttachmentSchema = z.object({
  ticketId: z.string().min(1),
  projectId: z.string().min(1),
});

/** Shape returned to the browser after a successful upload. */
export type UploadedAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  /** Which message contentType this file should be sent as. */
  contentType: "IMAGE" | "FILE";
};
