// Pure helpers extracted from src/app/quick-add/page.tsx during the
// Budget Boss god-module decomposition (2026-08-18). Keeping this logic
// framework-free makes it unit-testable without React (see parse-entry.test.ts).

import type { ExpenseEntry, ExpenseCategory } from '@/lib/types/budget';

export interface ParsedManualEntry {
  /** Amount parsed from the free-text input. 0 when no number is present. */
  amount: number;
  /** The remaining text after stripping the leading amount token. */
  note: string;
}

/**
 * Parse a Quick Add free-text input of the form "120 lunch" or "lunch 120".
 * Mirrors the previous inline logic in handleSave: the first numeric token is
 * the amount; whatever remains (sans that token) is the note.
 */
export function parseManualEntry(input: string): ParsedManualEntry {
  const trimmed = input.trim();
  const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  const amount = numberMatch ? parseFloat(numberMatch[1]) : 0;
  const note = (numberMatch ? trimmed.replace(numberMatch[0], '') : trimmed).trim();
  return { amount, note };
}

/**
 * Find the most recent prior expense with a merchant matching `merchant`
 * case-insensitively — the Repeat Purchase "+" candidate on the scanned receipt
 * review card. Returns undefined when there is no match or no merchant.
 */
export function findRepeatCandidate(
  expenses: ExpenseEntry[] | undefined,
  merchant: string,
): ExpenseEntry | undefined {
  const needle = merchant.trim().toLowerCase();
  if (!needle) return undefined;
  return (expenses ?? [])
    .filter((e) => e.merchant?.trim().toLowerCase() === needle)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

/** Re-export the category type for callers that only import this module. */
export type { ExpenseCategory };
