// modules/budgeting/csv-import.ts
//
// Pure, dependency-free CSV → ExpenseEntry parser for local bank/statement
// imports. No network, no external APIs — keeps BudgetBITCH local-first.
// Fully unit-tested in csv-import.test.ts.

import { mapThaiToCategory } from '@/lib/utils/thai-category-mapper';
import type { ExpenseCategory } from '@/lib/types/budget';

export interface ParsedExpense {
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amount: number; // positive
  category: ExpenseCategory;
  note?: string;
  source: 'import';
}

export interface ImportError {
  line: number; // 1-based file line number
  reason: string;
  raw: string;
}

export interface ImportResult {
  valid: ParsedExpense[];
  errors: ImportError[];
  total: number;
}

const KNOWN_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set<ExpenseCategory>([
  'housing',
  'transport',
  'food',
  'utilities',
  'phone_internet',
  'subscriptions',
  'entertainment',
  'healthcare',
  'insurance',
  'debt',
  'savings',
  'other',
]);

/**
 * Minimal RFC-4180-ish CSV parser. Handles quoted fields, embedded commas,
 * embedded newlines, and CRLF. Returns an array of row arrays (no header
 * stripping — callers decide which row is the header).
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') {
      i++;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Flush trailing field/row (file without trailing newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty trailing rows produced by a final newline.
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0].trim() === '') {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}

export type ColumnKey = 'date' | 'merchant' | 'amount' | 'category' | 'note';
export type ColumnMap = Partial<Record<ColumnKey, number>>;

const ENGLISH_HEADERS: Record<string, ColumnKey> = {
  date: 'date',
  day: 'date',
  posted: 'date',
  time: 'date',
  merchant: 'merchant',
  description: 'merchant',
  payee: 'merchant',
  name: 'merchant',
  detail: 'merchant',
  amount: 'amount',
  amt: 'amount',
  value: 'amount',
  total: 'amount',
  category: 'category',
  type: 'category',
  note: 'note',
  memo: 'note',
  notes: 'note',
  remarks: 'note',
};

const THAI_HEADERS: Record<string, ColumnKey> = {
  วันที่: 'date',
  วัน: 'date',
  วันที่จ่าย: 'date',
  รายการ: 'merchant',
  ชื่อ: 'merchant',
  ร้าน: 'merchant',
  รายจ่าย: 'merchant',
  จำนวนเงิน: 'amount',
  ยอด: 'amount',
  เงิน: 'amount',
  หมวดหมู่: 'category',
  ประเภท: 'category',
  หมายเหตุ: 'note',
  บันทึก: 'note',
  备注: 'note',
};

/**
 * Maps a header row (string[]) to column indices. Case-insensitive,
 * trims surrounding whitespace. Unknown headers are ignored.
 */
export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach((raw, idx) => {
    const key = raw.trim().toLowerCase();
    const resolved = ENGLISH_HEADERS[key] ?? THAI_HEADERS[key];
    if (resolved && map[resolved] === undefined) {
      map[resolved] = idx;
    }
  });
  return map;
}

/**
 * Parses a localized currency string into a positive number.
 * Strips currency symbols, thousands separators, and whitespace.
 * Parentheses are treated as positive magnitude (expense convention).
 * Returns null when no numeric value can be found.
 */
export function normalizeAmount(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  if (s === '') return null;
  // Parentheses denote magnitude (accounting negatives) → strip, keep value.
  const hadParens = /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, '');
  // Keep digits, separators, and the decimal point only.
  s = s.replace(/[^0-9.,-]/g, '');
  if (s === '') return null;
  // Normalize: if both comma and dot present, comma is the thousands sep.
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    // Single comma: treat as decimal separator only if it's the last comma
    // and followed by exactly 1-2 digits; otherwise treat as thousands sep.
    const lastComma = s.lastIndexOf(',');
    const after = s.slice(lastComma + 1);
    if (/^\d{1,2}$/.test(after) && s.indexOf(',') === lastComma) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }
  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  return hadParens ? abs : abs;
}

/**
 * Normalizes a date string to ISO yyyy-mm-dd.
 * - Accepts yyyy-mm-dd, yyyy/mm/dd, dd/mm/yyyy, mm/dd/yyyy, dd/mm/yy.
 * - When ambiguous (both parts <= 12) defaults to US mm/dd ordering.
 * - Day-first is applied when the middle/leading part exceeds 12.
 * Returns null when unparseable.
 */
export function normalizeDate(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (raw === '') return null;

  // ISO with dashes/spaces/slashes: yyyy-mm-dd or yyyy/mm/dd
  const isoLike = raw.match(/^(\d{4})[-/.\s](\d{1,2})[-/.\s](\d{1,2})/);
  if (isoLike) {
    const [, y, m, d] = isoLike;
    return toIso(Number(y), Number(m), Number(d));
  }

  // d/m/y or m/d/y (possibly 2-digit year)
  const parts = raw.split(/[-/.\s]+/).map((p) => p.trim());
  if (parts.length >= 3) {
    const [a, b, c] = parts as [string, string, string];
    const na = Number(a);
    const nb = Number(b);
    const isTwoDigitYear = c.length <= 2;
    const year = isTwoDigitYear ? 2000 + Number(c) : Number(c);
    let month: number;
    let day: number;
    if (isTwoDigitYear) {
      // International dd/mm/yy convention.
      day = na;
      month = nb;
    } else if (nb > 12) {
      // b cannot be a month → day-first: a=day, b=month
      day = na;
      month = nb;
    } else if (na > 12) {
      // a cannot be a month → a=day, b=month
      day = na;
      month = nb;
    } else {
      // ambiguous → US mm/dd
      month = na;
      day = nb;
    }
    const iso = toIso(year, month, day);
    if (iso) return iso;
  }

  // Last resort: native Date parse (e.g. "Jan 5 2026").
  const native = new Date(raw);
  if (!Number.isNaN(native.getTime())) {
    return native.toISOString().slice(0, 10);
  }

  return null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (month === 2 && day > 29) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  // Validates real calendar date via round-trip.
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${mm}-${dd}`;
}

/**
 * Resolves a category from an explicit value or merchant text.
 * Explicit known categories pass through; otherwise the existing
 * Thai/English mapper infers from free text; unknown falls back to 'other'.
 */
export function mapCategory(input: string | undefined): ExpenseCategory {
  if (input && KNOWN_CATEGORIES.has(input as ExpenseCategory)) {
    return input as ExpenseCategory;
  }
  if (input && input.trim() !== '') {
    const inferred = mapThaiToCategory(input.trim());
    if (inferred && inferred !== 'other') return inferred;
  }
  return 'other';
}

/**
 * End-to-end: parse CSV text → ImportResult (valid rows + per-row errors).
 * Header detection is automatic; the first row is assumed to be the header.
 * The returned line numbers in errors are 1-based file line numbers.
 */
export function parseImport(csv: string): ImportResult {
  const valid: ParsedExpense[] = [];
  const errors: ImportError[] = [];

  if (!csv || csv.trim() === '') {
    return { valid, errors, total: 0 };
  }

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { valid, errors, total: 0 };
  }

  const header = rows[0];
  const columns = detectColumns(header);

  // date and amount are mandatory for a usable expense row.
  if (columns.date === undefined || columns.amount === undefined) {
    return {
      valid,
      errors: [
        {
          line: 1,
          reason: 'Missing required columns: date and amount headers not detected.',
          raw: header.join(','),
        },
      ],
      total: 0,
    };
  }

  const dataRows = rows.slice(1);
  let total = 0;

  dataRows.forEach((cells, idx) => {
    total += 1;
    const fileLine = idx + 2; // header is line 1
    const raw = cells.join(',');

    // Skip completely empty rows (e.g. trailing blanks already handled, but be safe).
    if (cells.length === 0 || cells.every((c) => c.trim() === '')) {
      return;
    }

    const dateStr = cells[columns.date!]?.trim() ?? '';
    const amountStr = cells[columns.amount!]?.trim() ?? '';
    const merchant = columns.merchant !== undefined ? (cells[columns.merchant]?.trim() ?? '') : '';
    const categoryStr = columns.category !== undefined ? (cells[columns.category]?.trim() ?? '') : '';
    const note = columns.note !== undefined ? (cells[columns.note]?.trim() ?? '') : '';

    const date = normalizeDate(dateStr);
    const amount = normalizeAmount(amountStr);

    if (!date) {
      errors.push({ line: fileLine, reason: `Invalid date: "${dateStr}"`, raw });
      return;
    }
    if (amount === null) {
      errors.push({ line: fileLine, reason: `Invalid amount: "${amountStr}"`, raw });
      return;
    }

    const category: ExpenseCategory =
      categoryStr && KNOWN_CATEGORIES.has(categoryStr as ExpenseCategory)
        ? (categoryStr as ExpenseCategory)
        : mapCategory(categoryStr || merchant);

    valid.push({
      date,
      merchant: merchant || 'Imported',
      amount,
      category,
      note: note || undefined,
      source: 'import',
    });
  });

  return { valid, errors, total };
}
