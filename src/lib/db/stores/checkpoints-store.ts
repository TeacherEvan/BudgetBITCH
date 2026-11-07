// lib/db/stores/checkpoints-store.ts
import { getDB, USER_DATA_STORES, recordLocalWritesBulk, notifyBoardChanged } from '../local-db';

const MAX_CHECKPOINTS = 3;

interface CheckpointItem {
  label: string;
  timestamp: number;
  backup: Record<string, unknown>;
}

interface BackupStores {
  [store: string]: unknown[];
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
    for (const store of backupStores) {
      backup[store] = await db.getAll(store);
    }
    const checkpointData = {
      label,
      timestamp: Date.now(),
      backup,
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

    // Clear and restore data in a single atomic multi-store transaction
    const restoreStores = [...USER_DATA_STORES, 'settings'] as const;
    const tx = db.transaction(restoreStores, 'readwrite');
    for (const store of restoreStores) {
      await tx.objectStore(store).clear();
    }

    const now = Date.now();
    const pendingWrites: Array<{ store: string; key: string; timestamp: number }> = [];

    // Restore data from checkpoint
    for (const [storeName, items] of Object.entries(checkpoint.backup)) {
      if (!restoreStores.includes(storeName as (typeof restoreStores)[number])) continue;
      const store = storeName as (typeof restoreStores)[number];
      const storeObj = tx.objectStore(store);
      if (Array.isArray(items)) {
        for (const item of items) {
          if ((store === 'wizardProfile' || store === 'settings') && item && typeof item === 'object') {
            await storeObj.put(item as never, 'current' as never);
            pendingWrites.push({ store, key: 'current', timestamp: now });
          } else {
            await storeObj.put(item as never);
            const rec = item as Record<string, unknown>;
            const key =
              store === 'budgets' ? (rec?.category as string) :
              store === 'netWorthSnapshots' ? (rec?.date as string) :
              store === 'criticalExpenseCommitments' ? (rec?.month as string) :
              (rec?.id as string);
            if (key) {
              pendingWrites.push({ store, key: String(key), timestamp: now });
            }
          }
        }
      }
    }
    await tx.done;

    // Stamp localWrites in batch to prevent stale remote sync from clobbering restored state
    if (pendingWrites.length > 0) {
      await recordLocalWritesBulk(pendingWrites);
    }
    notifyBoardChanged('local');

    console.log(`[Storage] Local checkpoint restored: ${checkpoint.label}`);
    return true;
  } catch (err) {
    console.error('Failed to restore checkpoint:', err);
    return false;
  }
}