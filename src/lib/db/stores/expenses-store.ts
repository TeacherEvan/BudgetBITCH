import type { ExpenseEntry, ExpenseCategory, CriticalExpenseCommitment } from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';
import { getDB, afterBoardMutation, generateId } from '../local-db';
import { logUserAction } from '@/lib/utils/action-logger';
import { getCurrentMember } from '../current-member';

// Expenses
export async function addExpense(expense: ExpenseEntry): Promise<void> {
  const member = getCurrentMember();
  // Stamp attribution so the synced-account dashboard can break down by member.
  if (!expense.createdByName) expense.createdByName = member ?? 'Personal';
  const db = await getDB();
  await db.add('expenses', expense);
  await afterBoardMutation('expenses', expense.id);
  logUserAction(`Add expense ${expense.category} ${expense.amount} (${expense.merchant || 'n/a'})`);
}

export async function updateExpense(expense: ExpenseEntry): Promise<void> {
  if (!expense.createdByName) expense.createdByName = getCurrentMember() ?? 'Personal';
  const db = await getDB();
  await db.put('expenses', expense);
  await afterBoardMutation('expenses', expense.id);
  logUserAction(`Update expense ${expense.category} ${expense.amount} (${expense.merchant || 'n/a'})`);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
  await afterBoardMutation('expenses', id);
  logUserAction(`Delete expense ${id}`);
}

export async function getExpenses(): Promise<ExpenseEntry[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('expenses', 'by-date', IDBKeyRange.bound(startDate, endDate));
  return all;
}

export async function getExpensesByCategory(category: ExpenseCategory): Promise<ExpenseEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('expenses', 'by-category', category);
}

/**
 * Repeat Purchase: clone an existing expense as a fresh entry with today's
 * date. The clone carries the same merchant/amount/category/lineItems so the
 * user can log the same purchase again without re-typing. `repeatedFrom`
 * links back to the original for lineage/audit.
 */
export async function repeatExpense(id: string): Promise<ExpenseEntry | null> {
  const db = await getDB();
  const original = await db.get('expenses', id);
  if (!original) return null;

  const clone: ExpenseEntry = {
    ...original,
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    note: original.note,
    source: 'manual',
    repeatedFrom: original.id,
  };

  await addExpense(clone);
  return clone;
}

// Critical Expense Commitments
export async function saveCriticalExpenseCommitment(commitment: CriticalExpenseCommitment): Promise<void> {
  const db = await getDB();
  await db.put('criticalExpenseCommitments', commitment);
  await afterBoardMutation('criticalExpenseCommitments', commitment.month);
}

export async function getCriticalExpenseCommitment(month: string): Promise<CriticalExpenseCommitment | undefined> {
  const db = await getDB();
  return db.get('criticalExpenseCommitments', month);
}

export async function deleteCriticalExpenseCommitment(month: string): Promise<void> {
  const db = await getDB();
  await db.delete('criticalExpenseCommitments', month);
  notifyBoardChanged();
}
