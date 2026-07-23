// Regression test for the missing `incomes` object-store bug.
//
// The `incomes` store was added in commit 08757d2 AFTER DB_VERSION had been
// frozen at 3 (f2ad263). Any local IndexedDB created at v3 therefore lacked
// the store, so reads/writes to it threw:
//   IDBDatabase.transaction: 'incomes' is not a known object store name
// The upgrade callback only runs on a version bump, so the store was never
// created for those users. This test reproduces that state and asserts the
// current schema upgrade brings the store into existence.
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { getDB, USER_DATA_STORES } from './local-db';

describe('legacy v3 schema upgrade (regression)', () => {
  it('creates the `incomes` store when opening a v3 database that lacks it', async () => {
    // Build a database at version 3 mirroring the v3 schema WITHOUT `incomes`
    // (the exact state affected users had before the store was introduced).
    const legacy = await openDB('budgetbitch', 3, {
      upgrade(db) {
        const v3Stores = [
          'wizardProfile',
          'expenses',
          'budgets',
          'bills',
          'savingsGoals',
          'netWorthSnapshots',
          'debts',
          'criticalExpenseCommitments',
          'newsCache',
          'locationCache',
          'settings',
          'accountsData',
          'localAccounts',
          'bbMeta',
          'localWrites',
        ];
        for (const name of v3Stores) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
        // Deliberately omit 'incomes'.
      },
    });
    expect(legacy.objectStoreNames.contains('incomes')).toBe(false);
    legacy.close();

    // The app opens at the current DB_VERSION; the upgrade callback must run
    // and create the previously-missing store (additive — no data lost).
    const db = await getDB();
    expect(db.objectStoreNames.contains('incomes')).toBe(true);

    // Stronger invariant: every user-data store referenced by the app exists
    // after opening. Catches any future "added store but forgot to bump
    // DB_VERSION" regression.
    const required = [...USER_DATA_STORES, 'settings'] as const;
    for (const store of required) {
      expect(db.objectStoreNames.contains(store)).toBe(true);
    }
  });
});
