const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number): string {
  const date = parseDate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const utcFrom = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const utcTo = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((utcTo - utcFrom) / DAY_MS);
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDate(iso));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parseDate(iso));
}

export function formatWeekdayDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDate(iso));
}

export function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(parseDate(iso));
}

export function dueLabel(nextReview: string, today: string): string {
  const difference = daysBetween(today, nextReview);
  if (difference < 0) {
    const overdue = Math.abs(difference);
    return `${overdue} ${overdue === 1 ? "day" : "days"} overdue`;
  }
  if (difference === 0) return "Due today";
  if (difference === 1) return "Due tomorrow";
  return `Due in ${difference} days`;
}

export function relativeActivityDate(date: string, today: string): string {
  const difference = daysBetween(date, today);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference > 1) return `${difference} days ago`;
  return formatShortDate(date);
}
