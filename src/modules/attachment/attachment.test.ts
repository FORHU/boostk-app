import { describe, expect, it } from "vitest";
import {
  CreateCustomerTicketMessageSchema,
  CreateTicketMessageSchema,
} from "@/modules/ticket-message/ticket-message.schema";
import { ATTACHMENT_MAX_BYTES, isAllowedMimeType, isImageMimeType } from "./attachment.schema";
import { validateAttachment } from "./attachment.service";
import { formatFileSize } from "./attachment.utils";

/** Build a File of an arbitrary size without allocating the bytes twice. */
const fileOf = (size: number, type: string, name = "test.bin") => new File([new Uint8Array(size)], name, { type });

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
