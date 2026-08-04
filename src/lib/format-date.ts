type DateInput = Date | string | number | null | undefined;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined) return null;

  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(input: DateInput): string {
  const date = toDate(input);
  return date ? dateFormatter.format(date) : "-";
}

export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  return date ? dateTimeFormatter.format(date) : "-";
}

export function formatRelative(input: DateInput, now = Date.now()): string {
  const date = toDate(input);
  if (!date) return "-";

  const seconds = Math.floor(Math.abs(now - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units = [
    { seconds: 60, suffix: "m" },
    { seconds: 60 * 60, suffix: "h" },
    { seconds: 60 * 60 * 24, suffix: "d" },
    { seconds: 60 * 60 * 24 * 30, suffix: "mo" },
    { seconds: 60 * 60 * 24 * 365, suffix: "y" },
  ];
  const unit = [...units].reverse().find((candidate) => seconds >= candidate.seconds) ?? units[0];
  const value = Math.floor(seconds / unit.seconds);
  const relative = `${value}${unit.suffix}`;

  return date.getTime() > now ? `in ${relative}` : `${relative} ago`;
}
