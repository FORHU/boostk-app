import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberRole, hasOrgRole, hasPlatformRole, ORG_ROLE } from "@/modules/auth/roles";
import { INTAKE_COOKIE_NAME } from "@/modules/intake/intake.constants";
import { TICKET_COOKIE_NAME } from "@/modules/ticket/ticket.constants";
import { ATTACHMENT_MAX_BYTES, isAllowedMimeType, isImageMimeType, type UploadedAttachment } from "./attachment.schema";

/** Public URL an attachment is served from. Stored verbatim in `TicketMessage.content`. */
export const attachmentUrl = (id: string) => `/api/attachments/${id}`;

/** Who is asking. Both sides may upload to, and read from, a ticket they belong to. */
export type AttachmentActor = { kind: "customer"; customerId: string } | { kind: "agent"; userId: string };

/**
 * Read a cookie straight off the request headers rather than via `getCookie`, so
 * this works the same in API route handlers as it does inside a server function.
 */
const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
};

/**
 * Decide whether the caller may touch `ticketId`'s attachments, and as whom.
 *
 * Four independent paths, mirroring the send paths in the app:
 *  - customer — holds the ticket cookie, which is only honoured for the project the
 *    ticket actually belongs to (a stale cookie from another project proves nothing);
 *  - intake visitor — holds the global-chat cookie. Deliberately NOT project-scoped:
 *    an intake ticket starts in the intake project and moves to the receiving org's
 *    project once triage routes it, and the visitor keeps the same conversation across
 *    that hop. The reference number is the credential, exactly as it is for the widget;
 *  - platform staff — answers global chat from triage, and is NOT a member of any org,
 *    so the org-membership branch below can never authorise them;
 *  - agent — authenticated, and a member of the owning org at AGENT or above, matching
 *    the gate on the inbox routes.
 *
 * Returns null when none holds. Callers must treat null as 403 and must never
 * fall back to trusting the attachment id itself — ids are unguessable, not secret.
 */
export const resolveAttachmentAccess = async (
  request: Request,
  ticketId: string,
  projectId?: string,
): Promise<AttachmentActor | null> => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { project: { select: { id: true, organizationId: true } } },
  });
  if (!ticket) return null;

  // When the caller names a project, it must be the ticket's own.
  if (projectId && ticket.projectId !== projectId) return null;

  const ticketReferenceNumber = readCookie(request, TICKET_COOKIE_NAME);
  if (ticketReferenceNumber && ticketReferenceNumber === ticket.referenceNumber) {
    return { kind: "customer", customerId: ticket.customerId };
  }

  // Global-chat visitor. Matched against the ticket's own reference number, so this
  // grants nothing anywhere else even after triage moves the conversation.
  const intakeReferenceNumber = readCookie(request, INTAKE_COOKIE_NAME);
  if (intakeReferenceNumber && intakeReferenceNumber === ticket.referenceNumber) {
    return { kind: "customer", customerId: ticket.customerId };
  }

  const authSession = await auth.api.getSession({ headers: request.headers });
  if (!authSession) return null;

  // Platform staff, before the org check: they hold no membership anywhere, so
  // `getMemberRole` would return nothing and they could never open an image a visitor
  // sent them in triage. Read from the database rather than the session payload, so a
  // revoked role takes effect on the next request.
  const staff = await prisma.user.findUnique({
    where: { id: authSession.user.id },
    select: { platformRole: true },
  });
  if (hasPlatformRole(staff?.platformRole)) {
    return { kind: "agent", userId: authSession.user.id };
  }

  const members = await prisma.member.findMany({
    where: { organizationId: ticket.project.organizationId },
    select: { userId: true, role: true },
  });
  const role = getMemberRole(members, authSession.user.id);
  if (!hasOrgRole(role, ORG_ROLE.AGENT)) return null;

  return { kind: "agent", userId: authSession.user.id };
};

export type AttachmentValidationError = { error: string; status: number };

/**
 * Validate an uploaded file against the size and MIME allowlists.
 * Returns null when the file is acceptable.
 */
export const validateAttachment = (file: File): AttachmentValidationError | null => {
  if (file.size === 0) return { error: "File is empty", status: 400 };
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return { error: `File is larger than ${Math.floor(ATTACHMENT_MAX_BYTES / (1024 * 1024))}MB`, status: 413 };
  }
  if (!isAllowedMimeType(file.type)) return { error: `Unsupported file type: ${file.type || "unknown"}`, status: 415 };
  return null;
};

/**
 * Strip any directory component a browser may have sent and bound the length, so a
 * filename can never be used to traverse paths or bloat the row.
 */
const sanitizeFilename = (name: string): string => {
  const base = name.split(/[\\/]/).pop()?.trim();
  if (!base) return "attachment";
  return base.slice(0, 200);
};

/**
 * Persist an upload and hand back everything the client needs to send it as a message.
 * The row is created before any message references it; see the `Attachment` model note
 * on orphans.
 */
export const storeAttachment = async (file: File, ticketId: string): Promise<UploadedAttachment> => {
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = sanitizeFilename(file.name);

  const attachment = await prisma.attachment.create({
    data: { filename, mimeType: file.type, size: bytes.byteLength, bytes, ticketId },
    select: { id: true, filename: true, mimeType: true, size: true },
  });

  return {
    id: attachment.id,
    url: attachmentUrl(attachment.id),
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    contentType: isImageMimeType(attachment.mimeType) ? "IMAGE" : "FILE",
  };
};
