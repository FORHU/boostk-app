import { INTAKE_RATE_LIMIT } from "./intake.constants";

/**
 * In-memory fixed-window rate limiter for the public intake endpoints.
 *
 * `/chat` is unauthenticated and discoverable by anyone, unlike the project widget which
 * at least requires knowing a project id. Without this, a single script can fill the
 * triage queue with junk conversations.
 *
 * SCOPE LIMIT — this is per-process. It is real protection for a single-instance deploy
 * and meaningfully raises the cost of casual abuse anywhere, but it does NOT hold across
 * horizontally scaled instances: an attacker spreading requests over N app servers gets
 * N times the budget. Moving the counters to Redis (or the existing RabbitMQ host's
 * companion store) is the follow-up before scaling out.
 */
type Window = { count: number; resetAt: number };

const sessionWindows = new Map<string, Window>();
const messageWindows = new Map<string, Window>();

// Bound the maps so a stream of unique keys cannot grow them without limit. Entries are
// cheap, but an unbounded Map on a public endpoint is itself a memory-exhaustion vector.
const MAX_TRACKED_KEYS = 10_000;

function hit(windows: Map<string, Window>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) sweep(windows, now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}

function sweep(windows: Map<string, Window>, now: number) {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
  // Still full of live windows: drop the oldest so new visitors are never locked out
  // entirely by a burst of active ones.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const oldest = [...windows.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt).slice(0, MAX_TRACKED_KEYS / 10);
    for (const [key] of oldest) windows.delete(key);
  }
}

/** True when this client may open another conversation. */
export const allowIntakeSession = (clientKey: string) =>
  hit(sessionWindows, clientKey, INTAKE_RATE_LIMIT.SESSIONS_PER_WINDOW, INTAKE_RATE_LIMIT.SESSION_WINDOW_MS);

/** True when this conversation may send another message. */
export const allowIntakeMessage = (referenceNumber: string) =>
  hit(messageWindows, referenceNumber, INTAKE_RATE_LIMIT.MESSAGES_PER_WINDOW, INTAKE_RATE_LIMIT.MESSAGE_WINDOW_MS);

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

/** Test seam — resets the in-memory windows. */
export function __resetIntakeRateLimits() {
  sessionWindows.clear();
  messageWindows.clear();
}
