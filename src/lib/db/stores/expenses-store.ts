import type { ExpenseEntry, ExpenseCategory, CriticalExpenseCommitment } from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';
import { getDB, afterBoardMutation } from '../local-db';
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
