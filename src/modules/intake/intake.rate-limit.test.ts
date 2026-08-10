import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTAKE_RATE_LIMIT } from "./intake.constants";
import {
  __resetIntakeRateLimits,
  allowIntakeMessage,
  allowIntakeSession,
  clientKeyFromRequest,
} from "./intake.rate-limit";

beforeEach(() => {
  __resetIntakeRateLimits();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("allowIntakeSession", () => {
  it("allows up to the limit then rejects", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      expect(allowIntakeSession("1.2.3.4")).toBe(true);
    }
    expect(allowIntakeSession("1.2.3.4")).toBe(false);
  });

  it("tracks each client independently", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }

    expect(allowIntakeSession("1.2.3.4")).toBe(false);
    expect(allowIntakeSession("5.6.7.8")).toBe(true);
  });

  it("frees the budget once the window elapses", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }
    expect(allowIntakeSession("1.2.3.4")).toBe(false);

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.SESSION_WINDOW_MS);

    expect(allowIntakeSession("1.2.3.4")).toBe(true);
  });

  it("keeps rejecting while still inside the window", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.SESSION_WINDOW_MS - 1);

    expect(allowIntakeSession("1.2.3.4")).toBe(false);
  });
});

describe("allowIntakeMessage", () => {
  it("limits per conversation, not per client", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      expect(allowIntakeMessage("TK-AAAAAA")).toBe(true);
    }

    expect(allowIntakeMessage("TK-AAAAAA")).toBe(false);
    expect(allowIntakeMessage("TK-BBBBBB")).toBe(true);
  });

  it("uses its own window, independent of the session limiter", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      allowIntakeMessage("TK-AAAAAA");
    }
    expect(allowIntakeMessage("TK-AAAAAA")).toBe(false);

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.MESSAGE_WINDOW_MS);

    expect(allowIntakeMessage("TK-AAAAAA")).toBe(true);
  });
});

describe("clientKeyFromRequest", () => {
  const request = (headers: Record<string, string>) => new Request("https://example.com/chat", { headers });

  it("prefers the first hop of x-forwarded-for", () => {
    expect(clientKeyFromRequest(request({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 10.0.0.2" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKeyFromRequest(request({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("returns a stable bucket when no proxy headers are present", () => {
    // Everyone unidentified shares one bucket. That is intentional: it fails toward
    // rate limiting rather than away from it.
    expect(clientKeyFromRequest(request({}))).toBe("unknown");
  });

  it("does not return an empty key for a blank forwarded header", () => {
    expect(clientKeyFromRequest(request({ "x-forwarded-for": "  " }))).toBe("unknown");
  });
});
