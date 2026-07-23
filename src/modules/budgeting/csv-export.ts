// src/modules/budgeting/csv-export.ts
import type { ExpenseEntry, IncomeEntry } from '@/lib/types/budget';

/**
 * Escapes a single string field according to RFC-4180 CSV rules.
 * Wraps in double quotes if field contains commas, double quotes, or newlines.
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportExpensesToCsv(expenses: ExpenseEntry[]): string {
  const header = 'date,merchant,amount,category,note,recurringId';
  if (!expenses || expenses.length === 0) {
    return header;
  }

  const rows = expenses.map((e) => [
    escapeCsvField(e.date),
    escapeCsvField(e.merchant),
    escapeCsvField(e.amount),
    escapeCsvField(e.category),
    escapeCsvField(e.note),
    escapeCsvField(e.recurringId),
  ].join(','));

  return [header, ...rows].join('\n');
}

export function exportIncomesToCsv(incomes: IncomeEntry[]): string {
  const header = 'date,source,amount,category,frequency,note';
  if (!incomes || incomes.length === 0) {
    return header;
  }

  const rows = incomes.map((i) => [
    escapeCsvField(i.date),
    escapeCsvField(i.source),
    escapeCsvField(i.amount),
    escapeCsvField(i.category),
    escapeCsvField(i.frequency),
    escapeCsvField(i.note),
  ].join(','));

  return [header, ...rows].join('\n');
}
