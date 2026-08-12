import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetAttachmentRateLimits, allowAttachmentUpload } from "./attachment.rate-limit";
import { ATTACHMENT_UPLOAD_WINDOW_MS, ATTACHMENT_UPLOADS_PER_WINDOW } from "./attachment.schema";

beforeEach(() => {
  __resetAttachmentRateLimits();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("allowAttachmentUpload", () => {
  it("allows a burst up to the limit then rejects", () => {
    for (let i = 0; i < ATTACHMENT_UPLOADS_PER_WINDOW; i++) {
      expect(allowAttachmentUpload("ticket-1").allowed).toBe(true);
    }

    expect(allowAttachmentUpload("ticket-1").allowed).toBe(false);
  });

  it("keys on the ticket, so one conversation cannot throttle another", () => {
    for (let i = 0; i < ATTACHMENT_UPLOADS_PER_WINDOW; i++) {
      allowAttachmentUpload("ticket-1");
    }

    expect(allowAttachmentUpload("ticket-1").allowed).toBe(false);
    expect(allowAttachmentUpload("ticket-2").allowed).toBe(true);
  });

  it("frees the budget once the window elapses", () => {
    // This is exactly why the burst limiter is not the real ceiling: a patient uploader
    // gets a fresh allowance every window. `assertAttachmentQuota` is what actually caps
    // a conversation's footprint.
    for (let i = 0; i < ATTACHMENT_UPLOADS_PER_WINDOW; i++) {
      allowAttachmentUpload("ticket-1");
    }
    expect(allowAttachmentUpload("ticket-1").allowed).toBe(false);

    vi.advanceTimersByTime(ATTACHMENT_UPLOAD_WINDOW_MS);

    expect(allowAttachmentUpload("ticket-1").allowed).toBe(true);
  });

  it("reports how long the caller has to wait", () => {
    for (let i = 0; i < ATTACHMENT_UPLOADS_PER_WINDOW; i++) {
      allowAttachmentUpload("ticket-1");
    }

    vi.advanceTimersByTime(ATTACHMENT_UPLOAD_WINDOW_MS - 60_000);

    expect(allowAttachmentUpload("ticket-1")).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });
});
