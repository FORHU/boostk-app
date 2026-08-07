// Shared date/time formatting.
//
// Every helper pins an explicit locale instead of using the runtime default.
// This app is server-rendered: `toLocaleDateString()` with no locale argument
// formats with the *server's* locale during SSR and the *browser's* locale on
// hydration. When those differ React reports a hydration mismatch and the text
// visibly flips after load. Pinning makes both sides agree.
const LOCALE = "en-GB";

// What every helper renders for a missing or unparseable date, so callers never
// have to null-check and the UI never shows the string "Invalid Date".
const EMPTY = "-";

export type DateInput = Date | string | number | null | undefined;

// Normalises the shapes we actually receive: Date from Prisma, ISO string from
// JSON responses, epoch milliseconds from notification payloads.
function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date only — "07 Aug 2026". */
export function formatDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return EMPTY;
  return date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Date and clock time — "07 Aug 2026, 14:30". */
export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return EMPTY;
  return date.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Clock time only — "14:30". For timestamps already grouped under a date. */
export function formatTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return EMPTY;
  return date.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

// Past a week, "312d ago" stops being meaningful — fall back to the real date.
const RELATIVE_CUTOFF_DAYS = 7;

/**
 * Human-relative age — "just now", "5m ago", "3h ago", "2d ago", then the
 * absolute date once it is older than a week.
 *
 * `now` is injectable so tests do not need fake timers.
 */
export function formatRelative(input: DateInput, now: number = Date.now()): string {
  const date = toDate(input);
  if (!date) return EMPTY;

  const seconds = Math.round((now - date.getTime()) / 1000);

  // Negative means the timestamp is in the future, which happens with a little
  // clock skew between the server and the browser. "just now" beats "-1m ago".
  if (seconds < MINUTE) return "just now";

  // floor, not round: at 59 minutes users should still see "59m ago", not "1h ago".
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;

  const days = Math.floor(seconds / DAY);
  if (days <= RELATIVE_CUTOFF_DAYS) return `${days}d ago`;

  return formatDate(date);
}
