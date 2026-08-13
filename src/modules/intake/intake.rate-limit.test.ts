import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTAKE_RATE_LIMIT } from "./intake.constants";
import { __resetIntakeRateLimits, allowIntakeMessage, allowIntakeSession } from "./intake.rate-limit";

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
      expect(allowIntakeSession("1.2.3.4").allowed).toBe(true);
    }
    expect(allowIntakeSession("1.2.3.4").allowed).toBe(false);
  });

  it("tracks each client independently", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }

    expect(allowIntakeSession("1.2.3.4").allowed).toBe(false);
    expect(allowIntakeSession("5.6.7.8").allowed).toBe(true);
  });

  it("frees the budget once the window elapses", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }
    expect(allowIntakeSession("1.2.3.4").allowed).toBe(false);

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.SESSION_WINDOW_MS);

    expect(allowIntakeSession("1.2.3.4").allowed).toBe(true);
  });

  it("keeps rejecting while still inside the window", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.SESSION_WINDOW_MS - 1);

    expect(allowIntakeSession("1.2.3.4").allowed).toBe(false);
  });

  it("reports how long the caller has to wait", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW; i++) {
      allowIntakeSession("1.2.3.4");
    }

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.SESSION_WINDOW_MS - 30_000);

    const verdict = allowIntakeSession("1.2.3.4");
    expect(verdict).toEqual({ allowed: false, retryAfterSeconds: 30 });
  });
});

describe("allowIntakeMessage", () => {
  it("limits per conversation, not per client", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      expect(allowIntakeMessage("TK-AAAAAA").allowed).toBe(true);
    }

    expect(allowIntakeMessage("TK-AAAAAA").allowed).toBe(false);
    expect(allowIntakeMessage("TK-BBBBBB").allowed).toBe(true);
  });

  it("uses its own window, independent of the session limiter", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      allowIntakeMessage("TK-AAAAAA");
    }
    expect(allowIntakeMessage("TK-AAAAAA").allowed).toBe(false);

    vi.advanceTimersByTime(INTAKE_RATE_LIMIT.MESSAGE_WINDOW_MS);

    expect(allowIntakeMessage("TK-AAAAAA").allowed).toBe(true);
  });

  it("does not spend the session budget", () => {
    for (let i = 0; i < INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW; i++) {
      allowIntakeMessage("TK-AAAAAA");
    }

    expect(allowIntakeSession("1.2.3.4").allowed).toBe(true);
  });
});
