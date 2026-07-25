import type { ExpenseEntry, IncomeEntry, BudgetCategory } from '@/lib/types/budget';

/**
 * CSV formula-injection defense. Fields beginning with = + - @ tab CR or
 * newline are interpreted as a formula by Excel/Sheets/OpenOffice and can
 * execute. Prefix with a single quote so the cell renders as literal text.
 */
const FORMULA_INJECTION_PREFIXES = /^[\t=+\-@\r\n]/;

/**
 * Escapes a single string field according to RFC-4180 CSV rules.
 * Wraps in double quotes if field contains commas, double quotes, or newlines.
 * Also neutralizes formula-injection prefixes.
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  let str = String(val);
  if (FORMULA_INJECTION_PREFIXES.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const UTF8_BOM = '\uFEFF';

export function exportExpensesToCsv(expenses: ExpenseEntry[], includeBom = false): string {
  const header = 'date,merchant,amount,category,note,recurringId';
  if (!expenses || expenses.length === 0) {
    return (includeBom ? UTF8_BOM : '') + header;
  }

  const rows = expenses.map((e) => [
    escapeCsvField(e.date),
    escapeCsvField(e.merchant),
    escapeCsvField(e.amount),
    escapeCsvField(e.category),
    escapeCsvField(e.note),
    escapeCsvField(e.recurringId),
  ].join(','));

  const csv = [header, ...rows].join('\n');
  return includeBom ? UTF8_BOM + csv : csv;
}

export function exportIncomesToCsv(incomes: IncomeEntry[], includeBom = false): string {
  const header = 'date,source,amount,category,frequency,note';
  if (!incomes || incomes.length === 0) {
    return (includeBom ? UTF8_BOM : '') + header;
  }

  const rows = incomes.map((i) => [
    escapeCsvField(i.date),
    escapeCsvField(i.source),
    escapeCsvField(i.amount),
    escapeCsvField(i.category),
    escapeCsvField(i.frequency),
    escapeCsvField(i.note),
  ].join(','));

  const csv = [header, ...rows].join('\n');
  return includeBom ? UTF8_BOM + csv : csv;
}

export function exportBudgetsToCsv(budgets: BudgetCategory[], includeBom = false): string {
  const header = 'category,monthlyLimit,alertAtPct';
  if (!budgets || budgets.length === 0) {
    return (includeBom ? UTF8_BOM : '') + header;
  }

  const rows = budgets.map((b) => [
    escapeCsvField(b.category),
    escapeCsvField(b.monthlyLimit),
    escapeCsvField(b.alertAtPct),
  ].join(','));

  const csv = [header, ...rows].join('\n');
  return includeBom ? UTF8_BOM + csv : csv;
}

/**
 * Triggers a real browser download of the given CSV string via a Blob URL.
 * No-op outside a browser (SSR / tests without DOM), returns true if a
 * download was attempted. The object URL is always revoked to avoid leaks.
 */
export function downloadCsv(csv: string, filename: string): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return false;
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}
