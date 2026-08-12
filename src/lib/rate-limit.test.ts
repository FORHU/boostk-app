import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clientKeyFromRequest,
  createRateLimiter,
  formatRetryAfter,
  RATE_LIMITED_CODE,
  type RateLimitPayload,
  rateLimitedResponse,
  readRateLimit,
} from "./rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("allows up to the limit then rejects", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("tracks each key independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("frees the budget once the window elapses", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a");
    expect(limiter.check("a").allowed).toBe(false);

    vi.advanceTimersByTime(1000);

    expect(limiter.check("a").allowed).toBe(true);
  });

  it("counts the retry-after down as the window drains", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.check("a");

    expect(limiter.check("a")).toEqual({ allowed: false, retryAfterSeconds: 60 });

    vi.advanceTimersByTime(45_000);

    expect(limiter.check("a")).toEqual({ allowed: false, retryAfterSeconds: 15 });
  });

  it("never advertises a zero-second wait", () => {
    // A `Retry-After: 0` invites an immediate retry that is certain to fail again.
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a");

    vi.advanceTimersByTime(999);

    const verdict = limiter.check("a");
    expect(verdict.allowed).toBe(false);
    expect(verdict.allowed === false && verdict.retryAfterSeconds).toBe(1);
  });

  it("does not grow without bound as unique keys arrive", () => {
    // The map is swept rather than left to accumulate — an unbounded Map on a public
    // endpoint is itself a memory-exhaustion vector.
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxTrackedKeys: 50 });

    for (let i = 0; i < 500; i++) limiter.check(`key-${i}`);

    // Whatever was evicted, a fresh key is still served rather than locked out.
    expect(limiter.check("newcomer").allowed).toBe(true);
  });

  it("evicts expired windows before live ones", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxTrackedKeys: 10 });

    for (let i = 0; i < 10; i++) limiter.check(`old-${i}`);
    vi.advanceTimersByTime(1001);

    // The old windows have expired, so the sweep reclaims them and `recent` survives.
    limiter.check("recent");
    for (let i = 0; i < 9; i++) limiter.check(`filler-${i}`);

    expect(limiter.check("recent").allowed).toBe(false);
  });

  it("reset drops every window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a");
    expect(limiter.check("a").allowed).toBe(false);

    limiter.reset();

    expect(limiter.check("a").allowed).toBe(true);
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

describe("formatRetryAfter", () => {
  it("phrases short waits in seconds", () => {
    expect(formatRetryAfter(1)).toBe("1 second");
    expect(formatRetryAfter(45)).toBe("45 seconds");
  });

  it("rounds long waits up to whole minutes", () => {
    expect(formatRetryAfter(91)).toBe("2 minutes");
    expect(formatRetryAfter(3600)).toBe("60 minutes");
  });
});

describe("rateLimitedResponse", () => {
  it("answers 429 with a Retry-After header", () => {
    const response = rateLimitedResponse(30, "You're sending messages too quickly.");

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("does not use application/json", async () => {
    // TanStack's server-fn client parses an `application/json` body and returns it as the
    // RESULT even on a 429, which would fire the caller's onSuccess. Any other type falls
    // through to the throwing path. This assertion is the guard on that.
    const contentType = rateLimitedResponse(30, "Slow down.").headers.get("Content-Type");

    expect(contentType).toBe("application/problem+json");
    expect(contentType?.includes("application/json")).toBe(false);
  });

  it("carries the wait in the sentence and as a number", async () => {
    const payload = (await rateLimitedResponse(30, "Slow down.").json()) as RateLimitPayload;

    expect(payload).toEqual({
      code: RATE_LIMITED_CODE,
      error: "Slow down. Please try again in 30 seconds.",
      lead: "Slow down.",
      retryAfterSeconds: 30,
    });
  });
});

describe("readRateLimit", () => {
  it("reads the payload back off a server function's rejection", async () => {
    // A server fn rejects with an Error whose message is the response text — the client
    // never sees the response object, so the body is the only channel.
    const body = await rateLimitedResponse(30, "Slow down.").text();

    expect(readRateLimit(new Error(body))?.retryAfterSeconds).toBe(30);
  });

  it("reads an already-parsed body, as the upload route's caller has", async () => {
    const payload = await rateLimitedResponse(12, "Slow down.").json();

    expect(readRateLimit(payload)?.lead).toBe("Slow down.");
  });

  it("returns null for ordinary failures so callers keep their own message", () => {
    expect(readRateLimit(new Error("Failed to send message."))).toBeNull();
    expect(readRateLimit(new Error('{"error":"nope"}'))).toBeNull();
    expect(readRateLimit(null)).toBeNull();
    expect(readRateLimit(undefined)).toBeNull();
    expect(readRateLimit({ code: "SOMETHING_ELSE" })).toBeNull();
  });

  it("survives a message that mentions the code but is not the payload", () => {
    expect(readRateLimit(new Error(`not json but says ${RATE_LIMITED_CODE}`))).toBeNull();
  });
});
