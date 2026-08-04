import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatRelative } from "./format-date";

const now = Date.parse("2026-08-04T12:00:00.000Z");

describe("formatDate", () => {
  it("formats a date consistently", () => {
    expect(formatDate("2026-08-04T12:00:00.000Z")).toBe("Aug 4, 2026");
  });

  it("returns a placeholder for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("not a date")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("includes the date and time", () => {
    expect(formatDateTime("2026-08-04T12:05:00.000Z")).toMatch(/Aug 4, 2026, \d{1,2}:05 (AM|PM)/);
  });
});

describe("formatRelative", () => {
  it.each([
    [30, "just now"],
    [60, "1m ago"],
    [2 * 60 * 60, "2h ago"],
    [3 * 24 * 60 * 60, "3d ago"],
    [2 * 30 * 24 * 60 * 60, "2mo ago"],
    [2 * 365 * 24 * 60 * 60, "2y ago"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatRelative(now - seconds * 1000, now)).toBe(expected);
  });

  it("handles future dates and invalid input", () => {
    expect(formatRelative(now + 2 * 60 * 60 * 1000, now)).toBe("in 2h");
    expect(formatRelative(undefined, now)).toBe("-");
  });
});
