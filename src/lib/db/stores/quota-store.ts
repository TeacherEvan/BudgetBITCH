// lib/db/stores/quota-store.ts

/**
 * Storage Quota and Persistence helpers
 * Requests persistent storage and reports usage/quota estimates.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persisted storage status: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('Failed to request persistent storage:', e);
    }
  }
  return false;
}

export async function getStorageEstimate(): Promise<{ persisted: boolean; usage: number; quota: number }> {
  if (typeof window !== 'undefined' && navigator.storage) {
    try {
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const estimate = navigator.storage.estimate ? await navigator.storage.estimate() : { usage: 0, quota: 0 };
      return {
        persisted,
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    } catch {
      return { persisted: false, usage: 0, quota: 0 };
    }
  }
  return { persisted: false, usage: 0, quota: 0 };
}