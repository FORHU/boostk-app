import { useCallback, useEffect, useState } from "react";
import { readRateLimit } from "@/lib/rate-limit";

export type RateLimitNotice = {
  /** True while this surface is cooling down. Composers disable themselves on it. */
  isLimited: boolean;
  /** Whole seconds remaining, for a live countdown. */
  secondsLeft: number;
  /** The server's sentence with the wait left off, safe to show verbatim. */
  lead: string | null;
  /**
   * Hand a failed request's error to the notice.
   *
   * Returns true when it was a 429 and the notice has taken it over, false when it was
   * an ordinary failure the caller should still report its own way — so a call site
   * reads `if (!rateLimit.capture(error)) toast(...)` and no failure goes silent.
   */
  capture: (error: unknown) => boolean;
};

/**
 * Turns a 429 into a visible, self-clearing "slow down" state.
 *
 * Every throttled surface used to fail into a generic "please try again" toast, which is
 * indistinguishable from a network blip and invites the visitor to hammer the button —
 * the one thing a rate limit is asking them not to do. Telling them how long, and
 * disabling the control until then, turns the rejection into instruction.
 *
 * The countdown is driven from the server's `Retry-After`, so the UI never re-enables
 * ahead of the window and never strands the visitor behind one that has already passed.
 */
export function useRateLimitNotice(): RateLimitNotice {
  const [until, setUntil] = useState<number | null>(null);
  const [lead, setLead] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (until === null) return;

    const tick = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        setUntil(null);
        setLead(null);
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  const capture = useCallback((error: unknown) => {
    const limit = readRateLimit(error);
    if (!limit) return false;

    setLead(limit.lead);
    setUntil(Date.now() + limit.retryAfterSeconds * 1000);
    return true;
  }, []);

  return { isLimited: until !== null, secondsLeft, lead, capture };
}
