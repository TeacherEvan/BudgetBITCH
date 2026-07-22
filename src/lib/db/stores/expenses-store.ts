import type { ExpenseEntry, ExpenseCategory, CriticalExpenseCommitment } from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';
import { getDB, afterBoardMutation } from '../local-db';

// Expenses
export async function addExpense(expense: ExpenseEntry): Promise<void> {
  const db = await getDB();
  await db.add('expenses', expense);
  await afterBoardMutation('expenses', expense.id);
}

export async function updateExpense(expense: ExpenseEntry): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
  await afterBoardMutation('expenses', expense.id);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
  await afterBoardMutation('expenses', id);
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
