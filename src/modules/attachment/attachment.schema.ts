import { z } from "zod";

/**
 * Hard ceiling on a single upload. Attachment bytes live in a Postgres column
 * (see the `Attachment` model), so this is deliberately small — it bounds both the
 * row size and the memory used to buffer the upload on the server.
 */
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

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
