import type { IncomeEntry, IncomeCategory } from '@/lib/types/budget';
import { getDB, putWithStamp } from '../local-db';
import { logUserAction } from '@/lib/utils/action-logger';
import { getCurrentMember } from '../current-member';

export async function addIncome(income: IncomeEntry): Promise<void> {
  if (!income.createdByName) income.createdByName = getCurrentMember() ?? 'Personal';
  // N6b: record + LWW stamp in ONE transaction; a stamp failure can no longer
  // leave an unstamped income that a later push fails to propagate.
  await putWithStamp('incomes', income);
  logUserAction(`Add income ${income.category} ${income.amount} (${income.source || 'n/a'})`);
}

export async function updateIncome(income: IncomeEntry): Promise<void> {
  if (!income.createdByName) income.createdByName = getCurrentMember() ?? 'Personal';
  await putWithStamp('incomes', income);
  logUserAction(`Update income ${income.category} ${income.amount}`);
}

export async function deleteIncome(id: string): Promise<void> {
  await putWithStamp('incomes', null, id);
  logUserAction(`Delete income ${id}`);
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
