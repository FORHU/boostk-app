/**
 * Fixed-window rate limiting for every public surface in the app.
 *
 * One mechanism, many policies. This module owns the counting and the 429 payload;
 * each module declares its own budgets next to the endpoints they protect — see
 * `intake.rate-limit.ts`, `ticket.rate-limit.ts` and `attachment.rate-limit.ts`.
 * Adding a surface should mean adding a `createRateLimiter` call, never a second
 * implementation with its own idea of what a window is.
 *
 * SCOPE LIMIT — the counters are per-process. They are real protection for a
 * single-instance deploy and meaningfully raise the cost of casual abuse anywhere, but
 * they do NOT hold across horizontally scaled instances: an attacker spreading requests
 * over N app servers gets N times the budget. Moving the windows to Redis (or a
 * companion store on the existing RabbitMQ host) is the follow-up before scaling out.
 *
 * Deliberately free of server-only imports. The chat widgets import `readRateLimit` to
 * render their "slow down" state, so anything pulled in here lands in the browser bundle
 * — the same rule `ticket.constants.ts` follows.
 */

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export type RateLimiter = {
  /** Records one hit against `key` and reports whether it may proceed. */
  check(key: string): RateLimitVerdict;
  /** Test seam — drops every window. */
  reset(): void;
};

type Window = { count: number; resetAt: number };

// Bound the maps so a stream of unique keys cannot grow them without limit. Entries are
// cheap, but an unbounded Map on a public endpoint is itself a memory-exhaustion vector.
const DEFAULT_MAX_TRACKED_KEYS = 10_000;

const ALLOWED: RateLimitVerdict = { allowed: true };

export type RateLimiterOptions = {
  /** Hits permitted per key per window. */
  limit: number;
  windowMs: number;
  maxTrackedKeys?: number;
};

export function createRateLimiter({
  limit,
  windowMs,
  maxTrackedKeys = DEFAULT_MAX_TRACKED_KEYS,
}: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, Window>();

  const sweep = (now: number) => {
    for (const [key, window] of windows) {
      if (now >= window.resetAt) windows.delete(key);
    }
    // Still full of live windows: drop the oldest so new visitors are never locked out
    // entirely by a burst of active ones.
    if (windows.size >= maxTrackedKeys) {
      const oldest = [...windows.entries()]
        .sort((a, b) => a[1].resetAt - b[1].resetAt)
        .slice(0, Math.ceil(maxTrackedKeys / 10));
      for (const [key] of oldest) windows.delete(key);
    }
  };

  return {
    check(key) {
      const now = Date.now();
      const existing = windows.get(key);

      if (!existing || now >= existing.resetAt) {
        if (windows.size >= maxTrackedKeys) sweep(now);
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return ALLOWED;
      }

      if (existing.count >= limit) {
        // Never advertise 0 — a `Retry-After: 0` invites an immediate retry that is
        // certain to fail again.
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
      }

      existing.count += 1;
      return ALLOWED;
    },
    reset() {
      windows.clear();
    },
  };
}

/**
 * Best-effort client identity for rate limiting. Proxy headers are attacker-controlled,
 * so this is a speed bump rather than an identity: it stops naive floods, not a
 * determined attacker rotating `x-forwarded-for`. Pair with edge/CDN limits in prod.
 */
export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// ---------------------------------------------------------------------------
// The 429 payload, and reading it back on the client.
// ---------------------------------------------------------------------------

export const RATE_LIMITED_CODE = "RATE_LIMITED";

export type RateLimitPayload = {
  code: typeof RATE_LIMITED_CODE;
  /**
   * The complete sentence, wait included. Safe to show verbatim, and named `error` to
   * match the shape the upload route already returns — so `use-attachment-upload` needs
   * no special case to surface it.
   */
  error: string;
  /**
   * The same sentence with the wait left off. A UI counting down live has to render the
   * remaining time itself; `error` freezes the wait at the moment of rejection and would
   * read "try again in 30 seconds" next to a timer showing 4.
   */
  lead: string;
  retryAfterSeconds: number;
};

/** "45 seconds" / "3 minutes" — the wait, phrased for a visitor rather than a log. */
export function formatRetryAfter(seconds: number): string {
  if (seconds <= 90) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * The 429 every throttled surface throws — server functions and the REST upload route
 * alike, so both transports answer identically.
 *
 * CONTENT TYPE IS LEAD, NOT DECORATION. TanStack's server-fn client inspects the
 * response before deciding whether the call failed (see `serverFnFetcher.ts`):
 *
 *   - `application/json` is parsed and RETURNED AS THE RESULT even when the status is
 *     429, so the caller's `onSuccess` would fire on a rejected request;
 *   - anything else falls through to `if (!response.ok) throw new Error(await
 *     response.text())`, which is the behaviour we want.
 *
 * `application/problem+json` (RFC 9457) is the standard type for an error body and does
 * not contain the substring `application/json`, so it lands on the throwing path while
 * still being ordinary JSON to `response.json()` and to anything calling the API directly.
 * The body therefore has to carry the structured detail: the client only ever sees the
 * response *text*, never its headers.
 *
 * `Retry-After` is set here rather than through `setResponseStatus`/`setResponseHeader`
 * because TanStack merges only `set-cookie` from the ambient response onto a non-2xx
 * result — every other ambient header is dropped. Throwing the Response is what puts
 * the header on the wire for CDNs, proxies and non-browser clients.
 */
export function rateLimitedResponse(retryAfterSeconds: number, lead: string): Response {
  const payload: RateLimitPayload = {
    code: RATE_LIMITED_CODE,
    error: `${lead} Please try again in ${formatRetryAfter(retryAfterSeconds)}.`,
    lead,
    retryAfterSeconds,
  };

  return new Response(JSON.stringify(payload), {
    status: 429,
    headers: {
      "Content-Type": "application/problem+json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

const isRateLimitPayload = (value: unknown): value is RateLimitPayload => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RateLimitPayload>;
  return (
    candidate.code === RATE_LIMITED_CODE &&
    typeof candidate.error === "string" &&
    typeof candidate.lead === "string" &&
    typeof candidate.retryAfterSeconds === "number"
  );
};

/**
 * Recognise a throttled request on the client, from either transport:
 *  - a server function rejects with an `Error` whose message is the response text;
 *  - the upload route's caller already has the parsed JSON body.
 *
 * Returns null for every other failure so callers keep their generic error message.
 */
export function readRateLimit(value: unknown): RateLimitPayload | null {
  if (isRateLimitPayload(value)) return value;

  const text = value instanceof Error ? value.message : typeof value === "string" ? value : null;
  // Cheap guard so an ordinary error message is never run through JSON.parse.
  if (!text?.includes(RATE_LIMITED_CODE)) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    return isRateLimitPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
