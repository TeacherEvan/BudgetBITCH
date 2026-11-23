// lib/db/stores/checkpoints-store.ts
import { getDB, USER_DATA_STORES, getAllLocalWrites, notifyBoardChanged } from '../local-db';

const MAX_CHECKPOINTS = 3;

interface CheckpointItem {
  label: string;
  timestamp: number;
  backup: Record<string, unknown>;
  /** Per-record LWW stamps captured at checkpoint time (`store:key` -> ms). */
  updatedAt?: Record<string, number>;
}

interface BackupStores {
  [store: string]: unknown[];
}

/** Primary-key suffix for a restored record, matching the localWrites scheme. */
function recordKey(store: string, rec: Record<string, unknown>): string | null {
  if (store === 'wizardProfile' || store === 'settings') return 'current';
  const key =
    store === 'budgets' ? rec.category :
    store === 'netWorthSnapshots' ? rec.date :
    store === 'criticalExpenseCommitments' ? rec.month :
    rec.id;
  if (key === undefined || key === null || key === '') return null;
  return String(key);
}

/**
 * Rolling local checkpoints for disaster recovery.
 * Stores up to MAX_CHECKPOINTS snapshots of all user data stores + settings.
 */
export async function createLocalCheckpoint(label: string): Promise<void> {
  try {
    const db = await getDB();
    const backup: BackupStores = {};
    // `settings` has no keyPath and is persisted under a fixed 'current' key
    // (see saveSettings); include it alongside the keyed stores so a checkpoint
    // can fully restore app preferences.
    const backupStores = [...USER_DATA_STORES, 'settings'] as const;
    const writes = await getAllLocalWrites();
    const updatedAt: Record<string, number> = {};
    for (const store of backupStores) {
      backup[store] = await db.getAll(store);
      // N6: capture each record's own LWW stamp so a rollback does not look
      // like a brand-new edit to every record on the next push.
      for (const item of backup[store]) {
        if (!item || typeof item !== 'object') continue;
        const key = recordKey(store, item as Record<string, unknown>);
        if (!key) continue;
        const stamp = writes.get(`${store}:${key}`);
        if (typeof stamp === 'number') updatedAt[`${store}:${key}`] = stamp;
      }
    }
    const checkpointData = {
      label,
      timestamp: Date.now(),
      backup,
      updatedAt,
    };

    const existingStr = await db.get('bbMeta', 'checkpoints');
    const checkpointsList = existingStr ? JSON.parse(existingStr) : [];
    checkpointsList.unshift(checkpointData);

    if (checkpointsList.length > MAX_CHECKPOINTS) {
      checkpointsList.pop();
    }

    await db.put('bbMeta', JSON.stringify(checkpointsList), 'checkpoints');
    console.log(`[Storage] Local checkpoint created: ${label}`);
  } catch (err) {
    console.error('Failed to create local checkpoint:', err);
  }
}

export async function getLocalCheckpoints(): Promise<{ label: string; timestamp: number }[]> {
  try {
    const db = await getDB();
    const existingStr = await db.get('bbMeta', 'checkpoints');
    if (!existingStr) return [];
    const checkpointsList = JSON.parse(existingStr) as CheckpointItem[];
    return checkpointsList.map((c) => ({ label: c.label, timestamp: c.timestamp }));
  } catch {
    return [];
  }
}

export async function restoreCheckpoint(timestamp: number): Promise<boolean> {
  try {
    const db = await getDB();
    const existingStr = await db.get('bbMeta', 'checkpoints');
    if (!existingStr) return false;
    const checkpointsList = JSON.parse(existingStr) as CheckpointItem[];
    const checkpoint = checkpointsList.find((c) => c.timestamp === timestamp);
    if (!checkpoint) return false;

    // N6: clear, restore AND stamp inside ONE transaction. Stamping with
    // Date.now() in a trailing transaction made every rolled-back record look
    // freshly edited, overwriting a partner's newer data on the next push.
    const restoreStores = [...USER_DATA_STORES, 'settings'] as const;
    type LooseCursor = {
      key: string | number;
      delete: () => Promise<void>;
      continue: () => Promise<LooseCursor | null>;
    };
    type LooseStore = {
      clear: () => Promise<void>;
      put: (value: unknown, key?: string) => Promise<unknown>;
      openCursor: () => Promise<LooseCursor | null>;
    };
    type LooseTx = { objectStore: (name: string) => LooseStore; done: Promise<void> };
    const wantLocalWrites = db.objectStoreNames.contains('localWrites');
    const txNames = (
      wantLocalWrites ? [...restoreStores, 'localWrites'] : [...restoreStores]
    ) as string[];
    const tx = (db.transaction as (names: string[], mode: 'readwrite') => unknown)(
      txNames,
      'readwrite',
    ) as LooseTx;
    const lwStore = wantLocalWrites ? tx.objectStore('localWrites') : null;
    const restoredStoreNames = new Set<string>(restoreStores);

    for (const store of restoreStores) {
      await tx.objectStore(store).clear();
    }

    if (lwStore) {
      // Drop stale stamps first so deleted pre-restore keys do not emit phantom
      // LWW tombstones after the rollback.
      let cursor = await lwStore.openCursor();
      while (cursor) {
        const colonIdx = String(cursor.key).indexOf(':');
        if (colonIdx !== -1 && restoredStoreNames.has(String(cursor.key).slice(0, colonIdx))) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
    }

    const capturedStamps = checkpoint.updatedAt ?? {};
    const fallbackTs = checkpoint.timestamp;
    for (const [storeName, items] of Object.entries(checkpoint.backup)) {
      if (!restoredStoreNames.has(storeName)) continue;
      const storeObj = tx.objectStore(storeName);
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const key = recordKey(storeName, item as Record<string, unknown>);
        if (!key) continue;
        const writeKey = `${storeName}:${key}`;
        const ts = typeof capturedStamps[writeKey] === 'number'
          ? capturedStamps[writeKey]
          : fallbackTs;
        if (storeName === 'wizardProfile' || storeName === 'settings') {
          await storeObj.put(item, 'current');
        } else {
          await storeObj.put(item);
        }
        if (lwStore) await lwStore.put(ts, writeKey);
      }
    }
    await tx.done;

    notifyBoardChanged('local');

    console.log(`[Storage] Local checkpoint restored: ${checkpoint.label}`);
    return true;
  } catch (err) {
    console.error('Failed to restore checkpoint:', err);
    return false;
  }
}