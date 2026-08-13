import { Star } from "lucide-react";
import { useState } from "react";

/**
 * The CSAT gate shown once a conversation is CLOSED: 1-5 stars, required before the
 * "Start a new conversation" button appears. Renders no copy around itself beyond the
 * prompt — callers mount it where their closed panel would go and flip their own state
 * on `onSubmit`.
 *
 * The actual persistence is the caller's concern: each surface (global chat, project
 * widget) has its own cookie-guarded server fn, so the mutation lives with the caller
 * and only `isPending` + `onSubmit(score)` cross the boundary here.
 */
export function SatisfactionRating({ isPending, onSubmit }: { isPending: boolean; onSubmit: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex-none p-4 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center">
      <h4 className="font-semibold text-gray-900 text-sm">How was your experience?</h4>
      <p className="text-xs text-gray-500 mt-1">Rate this conversation before starting a new one.</p>

      <fieldset className="flex items-center gap-1 mt-3 border-0 p-0" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = (hovered || score) >= value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              disabled={isPending}
              onMouseEnter={() => setHovered(value)}
              onClick={() => setScore(value)}
              className="p-0.5 transition-transform active:scale-90 disabled:opacity-60 disabled:active:scale-100"
            >
              <Star size={26} className={filled ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
            </button>
          );
        })}
      </fieldset>

      <button
        type="button"
        disabled={score === 0 || isPending}
        onClick={() => onSubmit(score)}
        className="mt-3 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {isPending ? "Saving…" : "Submit rating"}
      </button>
    </div>
  );
}
