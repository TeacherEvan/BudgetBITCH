export type DateCandidate = {
  date: string; // YYYY-MM-DD
  raw: string;
  isAmbiguous: boolean;
};

export type DateOptions = {
  countryHint?: string;
  now?: number;
};

const MONTH_MAP: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

function formatIso(year: number, month: number, day: number): string {
  const yStr = String(year).padStart(4, '0');
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

function isValidDate(year: number, month: number, day: number, nowMs: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return false;
  }
  const time = d.getTime();
  const ONE_DAY = 86400000;
  const TWO_YEARS = 2 * 365 * 86400000;

  if (time > nowMs + ONE_DAY) return false; // Reject future
  if (nowMs - time > TWO_YEARS) return false; // Reject > 2 years old
  return true;
}

export function extractDate(text: string, options: DateOptions = {}): DateCandidate | null {
  const nowMs = options.now ?? Date.now();
  const country = options.countryHint?.toUpperCase();

  // 1. Text month: e.g., 15 MAR 2026 or MAR 15, 2026
  const textMonthMatch = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})\b/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const mStr = textMonthMatch[2].toUpperCase();
    let year = parseInt(textMonthMatch[3], 10);
    if (year < 100) year += 2000;

    const month = MONTH_MAP[mStr];
    if (month && isValidDate(year, month, day, nowMs)) {
      return {
        date: formatIso(year, month, day),
        raw: textMonthMatch[0],
        isAmbiguous: false,
      };
    }
  }

  // 2. ISO YYYY-MM-DD format
  const isoMatch = text.match(/\b(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})\b/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    if (year > 2400) year -= 543; // Buddhist era

    if (isValidDate(year, month, day, nowMs)) {
      return {
        date: formatIso(year, month, day),
        raw: isoMatch[0],
        isAmbiguous: false,
      };
    }
  }

  // 3. Numeric DD/MM/YYYY or MM/DD/YYYY or DD/MM/YY
  const numMatch = text.match(/\b(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})\b/);
  if (numMatch) {
    const first = parseInt(numMatch[1], 10);
    const second = parseInt(numMatch[2], 10);
    let year = parseInt(numMatch[3], 10);

    if (year > 2400) year -= 543; // Buddhist era
    else if (year < 100) year += 2000;

    let day = first;
    let month = second;
    let isAmbiguous = false;

    // Check ambiguity if both <= 12 and different
    if (first <= 12 && second <= 12 && first !== second) {
      if (country === 'US') {
        month = first;
        day = second;
      } else if (country === 'ZA' || country === 'TH') {
        day = first;
        month = second;
      } else {
        isAmbiguous = true;
        // Default to DMY
        day = first;
        month = second;
      }
    } else if (first > 12) {
      // First is day
      day = first;
      month = second;
    } else if (second > 12) {
      // Second is day (MDY)
      month = first;
      day = second;
    }

    if (isValidDate(year, month, day, nowMs)) {
      return {
        date: formatIso(year, month, day),
        raw: numMatch[0],
        isAmbiguous,
      };
    }
  }

  return null;
}
