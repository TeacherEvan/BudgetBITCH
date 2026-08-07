// components/accounts/account-sync-mount.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { useAccountSync } from '@/hooks/use-account-sync';
import { restoreFromCloudSnapshot, syncDailySnapshot } from '@/lib/convex/sync-snapshots';
import { getExpenses, RESET_TOMBSTONE_KEY } from '@/lib/db/local-db';
import { ensurePersonalAccount } from '@/lib/db/accountStorage';
import { setCurrentMember } from '@/lib/db/current-member';
import { BOARD_CHANGED_EVENT, notifyBoardChanged } from '@/lib/types/budget';

const LAST_RESTORED_KEY = 'bb:lastCloudSnapshotAt';
const SNAPSHOT_DEBOUNCE_MS = 10000; // 10 seconds background debounce

/**
 * Side-effect-only component that drives Accounts-feature board sync
 * and automatic cloud snapshot restoration for authenticated users.
 * Ensures desktop and mobile data stay identical without manual action.
 */
export function AccountSyncMount() {
  useAccountSync();

  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const latestSnapshot = useQuery(
    api.snapshots.getLatestSnapshot,
    isAuthenticated ? {} : 'skip'
  );
  // Current member's display name — drives `createdBy`/`createdByName` stamps
  // on new expenses/incomes so the synced-account dashboard can attribute them.
  const currentUser = useQuery(
    api.feedback.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );

  const restoredSnapshotIdRef = useRef<string | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the current member name fresh so shared-account writes are attributed.
  useEffect(() => {
    if (currentUser?.name) {
      setCurrentMember(currentUser.name);
    } else if (!isAuthenticated) {
      setCurrentMember(null);
    }
  }, [currentUser, isAuthenticated]);

  // Ensure the personal account entry exists locally on first app load. Without
  // this, `localAccounts` stays empty until /accounts mounts, and the active
  // account's boardId can't resolve — which silently disables auto-sync on the
  // dashboard (the most common place entries are made).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensurePersonalAccount();
      } catch (err) {
        console.error('[AccountSyncMount] ensurePersonalAccount failed:', err);
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !latestSnapshot) return;
    if (!latestSnapshot.fullBackupData) return;
    const snapshotId = String(latestSnapshot._id || latestSnapshot.createdAt || '');
    if (restoredSnapshotIdRef.current === snapshotId) return;

    (async () => {
      try {
        const localExpenses = await getExpenses();
        const storedLastRestored = Number(localStorage.getItem(LAST_RESTORED_KEY) || '0');
        const snapshotTime = latestSnapshot.createdAt || 0;

        // Guard against re-restoring data the user just deleted. If a reset
        // tombstone exists and is newer than the snapshot, the snapshot is
        // stale and must not be pulled back.
        const resetAt = Number(localStorage.getItem(RESET_TOMBSTONE_KEY) || '0');
        if (resetAt > 0 && snapshotTime <= resetAt) {
          console.log('[AccountSyncMount] Skipping cloud restore: snapshot predates last reset.');
          restoredSnapshotIdRef.current = snapshotId;
          return;
        }

        // Auto-restore if local expenses are empty OR the cloud snapshot is newer than what was restored
        if (localExpenses.length === 0 || snapshotTime > storedLastRestored) {
          console.log('[AccountSyncMount] Auto-restoring cloud snapshot for desktop/mobile sync:', snapshotTime);
          const success = await restoreFromCloudSnapshot(latestSnapshot);
          if (success) {
            restoredSnapshotIdRef.current = snapshotId;
            localStorage.setItem(LAST_RESTORED_KEY, String(snapshotTime));
            notifyBoardChanged('remote');
          }
        }
      } catch (err) {
        console.error('[AccountSyncMount] Failed to auto-restore cloud snapshot:', err);
      }
    })();
  }, [isAuthenticated, latestSnapshot]);

  // Debounced auto-backup of daily snapshot when local data changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const onDataChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'remote' || customEvent.detail?.source === 'switch') {
        return;
      }
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = setTimeout(() => {
        void syncDailySnapshot();
      }, SNAPSHOT_DEBOUNCE_MS);
    };

    window.addEventListener(BOARD_CHANGED_EVENT, onDataChanged);
    return () => {
      window.removeEventListener(BOARD_CHANGED_EVENT, onDataChanged);
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    };
  }, [isAuthenticated]);

  return null;
}
