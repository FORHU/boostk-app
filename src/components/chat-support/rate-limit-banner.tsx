import { Clock } from "lucide-react";
import type { RateLimitNotice } from "@/hooks/use-rate-limit-notice";

const countdown = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/**
 * The "slow down" strip shown above a throttled composer.
 *
 * Amber rather than red: being asked to wait is not an error the visitor made, and the
 * conversation is not broken. `aria-live="polite"` because this appears in response to
 * the visitor's own action — a screen reader should hear it, but not mid-word.
 *
 * Colours are pinned rather than tokenised, matching the composers around it: these
 * widgets are embedded on light-only surfaces and inheriting `--foreground` put white
 * text on light backgrounds whenever the visitor's OS was in dark mode.
 */
export function RateLimitBanner({ notice }: { notice: RateLimitNotice }) {
  if (!notice.isLimited || !notice.lead) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900"
    >
      <Clock className="w-4 h-4 shrink-0" />
      <p className="text-xs leading-snug">
        {notice.lead} You can send again in{" "}
        <span className="font-semibold tabular-nums">{countdown(notice.secondsLeft)}</span>.
      </p>
    </div>
  );
}
