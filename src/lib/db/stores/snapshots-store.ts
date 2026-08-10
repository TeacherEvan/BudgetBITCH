import type { NetWorthSnapshot, BoardSnapshot } from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';
import { getDB, afterBoardMutation, getLocalWrite, recordLocalWriteAt } from '../local-db';

// Net Worth Snapshots
export async function saveNetWorthSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('netWorthSnapshots', snapshot);
  await afterBoardMutation('netWorthSnapshots', snapshot.date);
}

export async function getLatestNetWorthSnapshot(): Promise<NetWorthSnapshot | undefined> {
  const db = await getDB();
  const all = await db.getAll('netWorthSnapshots');
  return all.sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * Serialize the 8 shared local stores into a single BoardSnapshot.
 * User-local stores (settings, newsCache, locationCache) are intentionally excluded.
 */
export async function serializeBoard(): Promise<BoardSnapshot> {
  const db = await getDB();
  const [
    wizardProfile,
    expenses,
    budgets,
    bills,
    savingsGoals,
    netWorthSnapshots,
    debts,
    criticalExpenseCommitments,
    incomes,
  ] = await Promise.all([
    db.get('wizardProfile', 'current'),
    db.getAll('expenses'),
    db.getAll('budgets'),
    db.getAll('bills'),
    db.getAll('savingsGoals'),
    db.getAll('netWorthSnapshots'),
    db.getAll('debts'),
    db.getAll('criticalExpenseCommitments'),
    db.getAll('incomes'),
  ]);

  return {
    wizardProfile: wizardProfile ?? null,
    expenses,
    budgets,
    bills,
    savingsGoals,
    netWorthSnapshots,
    debts,
    criticalExpenseCommitments,
    incomes: incomes ?? [],
  };
}

/**
 * Merge the 8 shared local stores from a BoardSnapshot (union by key).
 * Local records whose keys are absent from the incoming snapshot are preserved;
 * incoming records overwrite same-key local records. This prevents a partner's
 * snapshot from clobbering local edits (e.g. an expense you just added on this
 * device) during the 2-way sync pull.
 *
 * Does NOT emit BOARD_CHANGED_EVENT — applying a remote board must not echo
 * back as a push.
 */
export async function replaceBoardData(board: BoardSnapshot): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments', 'incomes',
  ] as const;
  const activeStores = db.objectStoreNames
    ? stores.filter((s) => db.objectStoreNames.contains(s))
    : [...stores];
  if (activeStores.length === 0) return;
  const tx = db.transaction(activeStores, 'readwrite');

  const stage: { store: typeof stores[number]; value: unknown; explicitKey?: string | number }[] = [];

  if (board.wizardProfile) {
    stage.push({ store: 'wizardProfile', value: board.wizardProfile, explicitKey: 'current' });
  }
  for (const e of board.expenses ?? []) {
    stage.push({ store: 'expenses', value: e });
  }
  for (const b of board.budgets ?? []) {
    stage.push({ store: 'budgets', value: b });
  }
  for (const b of board.bills ?? []) {
    stage.push({ store: 'bills', value: b });
  }
  for (const g of board.savingsGoals ?? []) {
    stage.push({ store: 'savingsGoals', value: g });
  }
  for (const s of board.netWorthSnapshots ?? []) {
    stage.push({ store: 'netWorthSnapshots', value: s });
  }
  for (const d of board.debts ?? []) {
    stage.push({ store: 'debts', value: d });
  }
  for (const c of board.criticalExpenseCommitments ?? []) {
    stage.push({ store: 'criticalExpenseCommitments', value: c });
  }
  for (const i of board.incomes ?? []) {
    stage.push({ store: 'incomes', value: i });
  }

  for (const item of stage) {
    if (item.explicitKey !== undefined) {
      tx.objectStore(item.store).put(item.value as never, item.explicitKey as never);
    } else {
      tx.objectStore(item.store).put(item.value as never);
    }
  }

  await tx.done;
  notifyBoardChanged('switch');
}

/**
 * Serialize the 8 shared stores into the keyed-map form the server expects
 * for per-record merge sync: `{ "<store>:<key>": { value, updatedAt } }`.
 * Key scheme matches `applyRemoteBoard` and the server merge.
 */
/**
 * Resolve the last-known truth timestamp for a single record. Driven by the
 * `localWrites` store so each key carries ITS OWN timestamp instead of a
 * single "now" for the whole board. This is what makes the server's per-key
 * merge (boardMerge.ts) a real conflict-free sync: a record you didn't touch
 * keeps its old timestamp and is NOT clobbered by your push.
 */
async function tsFor(store: string, key: string | number): Promise<number> {
  try {
    return await getLocalWrite(store, String(key));
  } catch {
    return 0;
  }
}

export async function serializeBoardForSync(): Promise<Record<string, { value: unknown; updatedAt: number }>> {
  const board = await serializeBoard();
  const out: Record<string, { value: unknown; updatedAt: number }> = {};

  for (const e of board.expenses ?? []) out[`expenses:${e.id}`] = { value: e, updatedAt: await tsFor('expenses', e.id) };
  for (const b of board.budgets ?? []) out[`budgets:${b.category}`] = { value: b, updatedAt: await tsFor('budgets', b.category) };
  for (const i of board.incomes ?? []) out[`incomes:${i.id}`] = { value: i, updatedAt: await tsFor('incomes', i.id) };
  for (const b of board.bills ?? []) out[`bills:${b.id}`] = { value: b, updatedAt: await tsFor('bills', b.id) };
  for (const g of board.savingsGoals ?? []) out[`savingsGoals:${g.id}`] = { value: g, updatedAt: await tsFor('savingsGoals', g.id) };
  for (const s of board.netWorthSnapshots ?? []) out[`netWorthSnapshots:${s.date}`] = { value: s, updatedAt: await tsFor('netWorthSnapshots', s.date) };
  for (const d of board.debts ?? []) out[`debts:${d.id}`] = { value: d, updatedAt: await tsFor('debts', d.id) };
  for (const c of board.criticalExpenseCommitments ?? []) out[`criticalExpenseCommitments:${c.month}`] = { value: c, updatedAt: await tsFor('criticalExpenseCommitments', c.month) };

  return out;
}

export function serializeSnapshotForSync(snapshot: BoardSnapshot): Record<string, { value: unknown; updatedAt: number }> {
  const out: Record<string, { value: unknown; updatedAt: number }> = {};

  for (const e of snapshot.expenses ?? []) out[`expenses:${e.id}`] = { value: e, updatedAt: 0 };
  for (const b of snapshot.budgets ?? []) out[`budgets:${b.category}`] = { value: b, updatedAt: 0 };
  for (const i of snapshot.incomes ?? []) out[`incomes:${i.id}`] = { value: i, updatedAt: 0 };
  for (const b of snapshot.bills ?? []) out[`bills:${b.id}`] = { value: b, updatedAt: 0 };
  for (const g of snapshot.savingsGoals ?? []) out[`savingsGoals:${g.id}`] = { value: g, updatedAt: 0 };
  for (const s of snapshot.netWorthSnapshots ?? []) out[`netWorthSnapshots:${s.date}`] = { value: s, updatedAt: 0 };
  for (const d of snapshot.debts ?? []) out[`debts:${d.id}`] = { value: d, updatedAt: 0 };
  for (const c of snapshot.criticalExpenseCommitments ?? []) out[`criticalExpenseCommitments:${c.month}`] = { value: c, updatedAt: 0 };

  return out;
}

/**
 * Apply a server keyed-map onto local stores. Writes each record's value into
 * the matching store/key, preserving local-only records the server didn't
 * touch. Does NOT emit BOARD_CHANGED_EVENT (avoid echo-back push).
 */
export async function applyRemoteBoard(map: Record<string, { value: unknown; updatedAt: number }>): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments', 'incomes',
  ] as const;

  const stage: { store: typeof stores[number]; value: unknown; explicitKey?: string | number; updatedAt: number }[] = [];
  for (const [key, rec] of Object.entries(map)) {
    const [store, ...rest] = key.split(':');
    const recordKey = rest.join(':');
    if (!stores.includes(store as typeof stores[number])) continue;
    if (store === 'wizardProfile') {
      continue;
    } else {
      stage.push({ store: store as typeof stores[number], value: rec.value, explicitKey: recordKey, updatedAt: rec.updatedAt });
    }
  }

  const localTsMap = new Map<string, number>();
  await Promise.all(
    stage.map(async (item) => {
      const ts = await getLocalWrite(item.store, String(item.explicitKey));
      localTsMap.set(`${item.store}:${item.explicitKey}`, ts);
    }),
  );

  const activeStores = db.objectStoreNames
    ? stores.filter((s) => db.objectStoreNames.contains(s))
    : [...stores];
  if (activeStores.length === 0) return;
  const tx = db.transaction(activeStores, 'readwrite');
  for (const item of stage) {
    const localTs = localTsMap.get(`${item.store}:${item.explicitKey}`) ?? 0;
    if (item.updatedAt <= localTs) continue;
    if (item.store === 'wizardProfile' && item.explicitKey !== undefined) {
      tx.objectStore(item.store).put(item.value as never, item.explicitKey as never);
    } else {
      tx.objectStore(item.store).put(item.value as never);
    }
    // Stamp the local-write clock with THIS record's true timestamp
    // (not "now"), preserving the per-key merge on a later push.
    await recordLocalWriteAt(item.store, String(item.explicitKey), item.updatedAt);
  }
  await tx.done;
  notifyBoardChanged('remote');
}
