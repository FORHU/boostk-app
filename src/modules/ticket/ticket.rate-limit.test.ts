import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TICKET_RATE_LIMIT } from "./ticket.constants";
import {
  __resetTicketRateLimits,
  allowWidgetLookup,
  allowWidgetMessage,
  allowWidgetSession,
} from "./ticket.rate-limit";

beforeEach(() => {
  __resetTicketRateLimits();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("allowWidgetSession", () => {
  it("allows up to the limit then rejects", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      expect(allowWidgetSession("1.2.3.4").allowed).toBe(true);
    }
    expect(allowWidgetSession("1.2.3.4").allowed).toBe(false);
  });

  it("tracks each client independently", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowWidgetSession("1.2.3.4");
    }

    expect(allowWidgetSession("1.2.3.4").allowed).toBe(false);
    expect(allowWidgetSession("5.6.7.8").allowed).toBe(true);
  });

  it("frees the budget once the window elapses", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowWidgetSession("1.2.3.4");
    }
    expect(allowWidgetSession("1.2.3.4").allowed).toBe(false);

    vi.advanceTimersByTime(TICKET_RATE_LIMIT.SESSION_WINDOW_MS);

    expect(allowWidgetSession("1.2.3.4").allowed).toBe(true);
  });
});

describe("allowWidgetLookup", () => {
  it("bounds how many reference numbers one client may try", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.LOOKUPS_PER_WINDOW; i++) {
      expect(allowWidgetLookup("1.2.3.4").allowed).toBe(true);
    }

    expect(allowWidgetLookup("1.2.3.4").allowed).toBe(false);
  });

  it("spends its own budget, so guessing cannot be hidden behind new conversations", () => {
    // Separate windows on purpose: if lookups drew on the session budget, an attacker
    // could exhaust one to mask the other — and either limit alone would be the ceiling.
    for (let i = 0; i < TICKET_RATE_LIMIT.LOOKUPS_PER_WINDOW; i++) {
      allowWidgetLookup("1.2.3.4");
    }

    expect(allowWidgetLookup("1.2.3.4").allowed).toBe(false);
    expect(allowWidgetSession("1.2.3.4").allowed).toBe(true);
  });

  it("reports how long the caller has to wait", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.LOOKUPS_PER_WINDOW; i++) {
      allowWidgetLookup("1.2.3.4");
    }

    vi.advanceTimersByTime(TICKET_RATE_LIMIT.LOOKUP_WINDOW_MS - 20_000);

    expect(allowWidgetLookup("1.2.3.4")).toEqual({ allowed: false, retryAfterSeconds: 20 });
  });
});

describe("allowWidgetMessage", () => {
  it("limits per conversation, not per client", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      expect(allowWidgetMessage("TK-AAAAAA").allowed).toBe(true);
    }

    expect(allowWidgetMessage("TK-AAAAAA").allowed).toBe(false);
    expect(allowWidgetMessage("TK-BBBBBB").allowed).toBe(true);
  });

  it("uses its own window, independent of the session limiter", () => {
    for (let i = 0; i < TICKET_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      allowWidgetMessage("TK-AAAAAA");
    }
    expect(allowWidgetMessage("TK-AAAAAA").allowed).toBe(false);

    vi.advanceTimersByTime(TICKET_RATE_LIMIT.MESSAGE_WINDOW_MS);

    expect(allowWidgetMessage("TK-AAAAAA").allowed).toBe(true);
  });
});
