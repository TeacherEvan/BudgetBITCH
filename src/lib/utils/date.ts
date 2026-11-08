// lib/utils/date.ts
//
// Generic date helpers.

/** Returns an ISO 'YYYY-MM-DD' key for a Date in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses an ISO 'YYYY-MM-DD' calendar date in local time (never UTC midnight)
 * and formats it for display in the given locale. Prevents off-by-one day shifts
 * in negative UTC offset timezones (e.g. Americas UTC-3 to UTC-8).
 */
export function formatLocalCalendarDate(
  isoDate: string,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  if (!isoDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  const parsed = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(locale, options);
}

/**
 * Calculates whole calendar days until a monthly recurring bill's `dueDay` (1–31).
 * Clamps `dueDay` to the actual number of days in the target month (e.g. 28/29 in Feb)
 * and rolls over cleanly across December → January year boundaries.
 */
export function getDaysUntilDue(dueDay: number, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const clampedDueDay = Math.min(Math.max(1, dueDay), daysInCurrentMonth);
  let dueDate = new Date(currentYear, currentMonth, clampedDueDay);
  if (dueDate < today) {
    const nextMonthFirst = new Date(currentYear, currentMonth + 1, 1);
    const nextYear = nextMonthFirst.getFullYear();
    const nextMonth = nextMonthFirst.getMonth();
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const clampedNextDueDay = Math.min(Math.max(1, dueDay), daysInNextMonth);
    dueDate = new Date(nextYear, nextMonth, clampedNextDueDay);
  }
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
