import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CreateCustomerTicketMessageSchema,
  CreateTicketMessageSchema,
} from "@/modules/ticket-message/ticket-message.schema";
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_PER_TICKET,
  ATTACHMENT_MAX_TOTAL_BYTES,
  isAllowedMimeType,
  isImageMimeType,
} from "./attachment.schema";
import { assertAttachmentQuota, validateAttachment } from "./attachment.service";
import { formatFileSize } from "./attachment.utils";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    attachment: { aggregate: vi.fn() },
  },
}));

/** Build a File of an arbitrary size without allocating the bytes twice. */
const fileOf = (size: number, type: string, name = "test.bin") => new File([new Uint8Array(size)], name, { type });

// Prisma shapes `aggregate`'s result type from the call's own arguments, which a
// hand-built stub cannot reproduce — so drive the mock through an untyped handle rather
// than casting at every call site.
const aggregateMock = prisma.attachment.aggregate as unknown as Mock;

/** Stub what a ticket already holds, as `assertAttachmentQuota` counts it. */
const alreadyStored = (count: number, totalBytes: number | null) => {
  aggregateMock.mockResolvedValue({ _count: { _all: count }, _sum: { size: totalBytes } });
};

describe("validateAttachment", () => {
  it("accepts an allowed type within the size limit", () => {
    expect(validateAttachment(fileOf(1024, "image/png", "shot.png"))).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(validateAttachment(fileOf(0, "image/png"))?.status).toBe(400);
  });

  it("rejects a file over the size cap", () => {
    expect(validateAttachment(fileOf(ATTACHMENT_MAX_BYTES + 1, "image/png"))?.status).toBe(413);
  });

  it("accepts a file exactly at the cap", () => {
    expect(validateAttachment(fileOf(ATTACHMENT_MAX_BYTES, "image/png"))).toBeNull();
  });

  it("rejects a type outside the allowlist", () => {
    expect(validateAttachment(fileOf(64, "application/x-msdownload", "virus.exe"))?.status).toBe(415);
  });

  it("rejects a file with no MIME type at all", () => {
    expect(validateAttachment(fileOf(64, "", "unknown"))?.status).toBe(415);
  });
});

describe("assertAttachmentQuota", () => {
  beforeEach(() => {
    aggregateMock.mockReset();
  });

  it("accepts an upload into an empty conversation", async () => {
    alreadyStored(0, 0);

    expect(await assertAttachmentQuota("ticket-1", 1024)).toBeNull();
  });

  it("accepts one more file just under both ceilings", async () => {
    alreadyStored(ATTACHMENT_MAX_PER_TICKET - 1, 0);

    expect(await assertAttachmentQuota("ticket-1", 1024)).toBeNull();
  });

  it("rejects the file that would exceed the per-ticket count", async () => {
    // The gap the per-file cap left open: 500 small files were each individually legal.
    alreadyStored(ATTACHMENT_MAX_PER_TICKET, 1024);

    expect((await assertAttachmentQuota("ticket-1", 1024))?.status).toBe(413);
  });

  it("rejects the file that would exceed the per-ticket byte total", async () => {
    alreadyStored(1, ATTACHMENT_MAX_TOTAL_BYTES);

    expect((await assertAttachmentQuota("ticket-1", 1))?.status).toBe(413);
  });

  it("counts the incoming file against the total rather than after it", async () => {
    // Landing exactly on the ceiling is allowed; one byte past it is not.
    alreadyStored(1, ATTACHMENT_MAX_TOTAL_BYTES - 1024);
    expect(await assertAttachmentQuota("ticket-1", 1024)).toBeNull();

    alreadyStored(1, ATTACHMENT_MAX_TOTAL_BYTES - 1024);
    expect((await assertAttachmentQuota("ticket-1", 1025))?.status).toBe(413);
  });

  it("treats a ticket with no attachments as having used nothing", async () => {
    // Prisma reports `_sum.size` as null when there are no rows to sum.
    alreadyStored(0, null);

    expect(await assertAttachmentQuota("ticket-1", ATTACHMENT_MAX_BYTES)).toBeNull();
  });

  it("scopes the count to the ticket being uploaded to", async () => {
    alreadyStored(0, 0);
    await assertAttachmentQuota("ticket-42", 1024);

    expect(aggregateMock).toHaveBeenCalledWith(expect.objectContaining({ where: { ticketId: "ticket-42" } }));
  });
});

describe("mime classification", () => {
  it("treats the image types as images", () => {
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("image/webp")).toBe(true);
  });

  it("does not treat documents as images", () => {
    expect(isImageMimeType("application/pdf")).toBe(false);
    expect(isAllowedMimeType("application/pdf")).toBe(true);
  });

  it("keeps executables and SVG off the allowlist", () => {
    // SVG is excluded deliberately: it can carry script and is served from our origin.
    expect(isAllowedMimeType("image/svg+xml")).toBe(false);
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("scales through bytes, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("returns an empty string for nonsense input", () => {
    expect(formatFileSize(Number.NaN)).toBe("");
    expect(formatFileSize(-1)).toBe("");
  });
});

describe("message schema attachment rules", () => {
  const base = { ticketId: "t1" };

  it("requires an attachmentId on IMAGE and FILE messages", () => {
    expect(
      CreateTicketMessageSchema.safeParse({ ...base, content: "/api/attachments/a1", contentType: "IMAGE" }).success,
    ).toBe(false);
    expect(
      CreateTicketMessageSchema.safeParse({
        ...base,
        content: "/api/attachments/a1",
        contentType: "FILE",
        attachmentId: "a1",
      }).success,
    ).toBe(true);
  });

  it("rejects empty TEXT but allows text without an attachment", () => {
    expect(CreateTicketMessageSchema.safeParse({ ...base, content: "   ", contentType: "TEXT" }).success).toBe(false);
    expect(CreateTicketMessageSchema.safeParse({ ...base, content: "hello", contentType: "TEXT" }).success).toBe(true);
  });

  it("applies the same rules on the customer schema, which also needs projectId", () => {
    const withProject = { ...base, projectId: "p1" };
    expect(
      CreateCustomerTicketMessageSchema.safeParse({ ...withProject, content: "/x", contentType: "IMAGE" }).success,
    ).toBe(false);
    expect(
      CreateCustomerTicketMessageSchema.safeParse({
        ...withProject,
        content: "/x",
        contentType: "IMAGE",
        attachmentId: "a1",
      }).success,
    ).toBe(true);
    // projectId is not optional on the customer path.
    expect(CreateCustomerTicketMessageSchema.safeParse({ ...base, content: "hi", contentType: "TEXT" }).success).toBe(
      false,
    );
  });
});
