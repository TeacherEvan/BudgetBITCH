import type { IncomeEntry, IncomeCategory } from '@/lib/types/budget';
import { getDB, afterBoardMutation } from '../local-db';

export async function addIncome(income: IncomeEntry): Promise<void> {
  const db = await getDB();
  await db.add('incomes', income);
  await afterBoardMutation('incomes', income.id);
}

export async function updateIncome(income: IncomeEntry): Promise<void> {
  const db = await getDB();
  await db.put('incomes', income);
  await afterBoardMutation('incomes', income.id);
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('incomes', id);
  await afterBoardMutation('incomes', id);
}

export async function getIncomes(): Promise<IncomeEntry[]> {
  const db = await getDB();
  return db.getAll('incomes');
}

export async function getIncomesByDateRange(startDate: string, endDate: string): Promise<IncomeEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('incomes', 'by-date', IDBKeyRange.bound(startDate, endDate));
}

export async function getIncomesByCategory(category: IncomeCategory): Promise<IncomeEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('incomes', 'by-category', category);
}

export async function clearIncomes(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('incomes', 'readwrite');
  await tx.objectStore('incomes').clear();
  await tx.done;
}
