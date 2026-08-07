import { describe, expect, it } from "vitest";
import { type DateInput, formatDate, formatDateTime, formatRelative, formatTime } from "./format-date";

// Fixed reference point so relative assertions never depend on the wall clock.
const NOW = new Date("2026-08-07T12:00:00Z").getTime();
const ago = (seconds: number) => new Date(NOW - seconds * 1000);

const BAD_INPUTS: DateInput[] = [null, undefined, "", "not-a-date", Number.NaN];

describe("formatDate", () => {
  it("formats a date with a pinned locale", () => {
    expect(formatDate(new Date("2026-08-07T12:00:00Z"))).toBe("07 Aug 2026");
  });

  it("accepts ISO strings and epoch milliseconds", () => {
    expect(formatDate("2026-08-07T12:00:00Z")).toBe("07 Aug 2026");
    expect(formatDate(new Date("2026-08-07T12:00:00Z").getTime())).toBe("07 Aug 2026");
  });

  it.each(BAD_INPUTS)("renders a placeholder rather than 'Invalid Date' for %p", (input) => {
    expect(formatDate(input)).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("includes both the date and the clock time", () => {
    const result = formatDateTime(new Date("2026-08-07T12:00:00Z"));
    expect(result).toContain("Aug");
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it.each(BAD_INPUTS)("renders a placeholder for %p", (input) => {
    expect(formatDateTime(input)).toBe("-");
  });
});

describe("formatTime", () => {
  it("renders hours and minutes only", () => {
    expect(formatTime(new Date("2026-08-07T12:00:00Z"))).toMatch(/^\d{2}:\d{2}$/);
  });

  it.each(BAD_INPUTS)("renders a placeholder for %p", (input) => {
    expect(formatTime(input)).toBe("-");
  });
});

describe("formatRelative", () => {
  it("treats anything under a minute as 'just now'", () => {
    expect(formatRelative(ago(0), NOW)).toBe("just now");
    expect(formatRelative(ago(59), NOW)).toBe("just now");
  });

  it("counts whole minutes and hours without rounding up early", () => {
    expect(formatRelative(ago(60), NOW)).toBe("1m ago");
    // The bug this guards: Math.round would report 59 minutes as "1h ago".
    expect(formatRelative(ago(59 * 60), NOW)).toBe("59m ago");
    expect(formatRelative(ago(60 * 60), NOW)).toBe("1h ago");
    expect(formatRelative(ago(23 * 60 * 60), NOW)).toBe("23h ago");
  });

  it("counts days up to the one week cutoff", () => {
    expect(formatRelative(ago(24 * 60 * 60), NOW)).toBe("1d ago");
    expect(formatRelative(ago(7 * 24 * 60 * 60), NOW)).toBe("7d ago");
  });

  it("falls back to an absolute date once older than a week", () => {
    expect(formatRelative(ago(8 * 24 * 60 * 60), NOW)).toBe("30 Jul 2026");
  });

  it("shows 'just now' for future timestamps caused by clock skew", () => {
    expect(formatRelative(new Date(NOW + 30_000), NOW)).toBe("just now");
  });

  it.each(BAD_INPUTS)("renders a placeholder for %p", (input) => {
    expect(formatRelative(input, NOW)).toBe("-");
  });
});
