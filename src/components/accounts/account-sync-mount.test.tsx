// components/accounts/account-sync-mount.test.tsx
// N7: the auto-restore path must be account-aware before it touches local data.
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../../convex/_generated/api';

// Stable, distinguishable query refs (Convex's generated api is a proxy whose
// property access is not guaranteed to return an identical reference).
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    snapshots: { getLatestSnapshot: 'api.snapshots.getLatestSnapshot' },
    feedback: { getCurrentUser: 'api.feedback.getCurrentUser' },
  },
}));

const mocks = vi.hoisted(() => ({
  restore: vi.fn(async () => true),
  syncDaily: vi.fn(async () => ({ success: true, date: '' })),
  getExpenses: vi.fn(async () => [] as unknown[]),
  getCurrentAccountId: vi.fn(async () => 'personal'),
  claimLocalDataOwner: vi.fn(async () => 'unchanged'),
  ensurePersonalAccount: vi.fn(async () => undefined),
  setCurrentMember: vi.fn(),
  notifyBoardChanged: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock('convex/react', () => ({ useQuery: mocks.useQuery }));
vi.mock('@/hooks/use-account-sync', () => ({ useAccountSync: vi.fn() }));
vi.mock('@/lib/convex/sync-snapshots', () => ({
  restoreFromCloudSnapshot: mocks.restore,
  syncDailySnapshot: mocks.syncDaily,
}));
vi.mock('@/lib/db/local-db', () => ({
  getExpenses: mocks.getExpenses,
  RESET_TOMBSTONE_KEY: 'bb:lastResetAt',
}));
vi.mock('@/lib/db/accountStorage', () => ({
  ensurePersonalAccount: mocks.ensurePersonalAccount,
  getCurrentAccountId: mocks.getCurrentAccountId,
}));
vi.mock('@/lib/db/data-owner', () => ({ claimLocalDataOwner: mocks.claimLocalDataOwner }));
vi.mock('@/lib/db/current-member', () => ({ setCurrentMember: mocks.setCurrentMember }));
vi.mock('@/lib/types/budget', () => ({
  BOARD_CHANGED_EVENT: 'budgetbitch:boardChanged',
  notifyBoardChanged: mocks.notifyBoardChanged,
}));

import { AccountSyncMount } from './account-sync-mount';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('AccountSyncMount auto-restore (N7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.restore.mockResolvedValue(true);
    mocks.getExpenses.mockResolvedValue([]);
    mocks.getCurrentAccountId.mockResolvedValue('personal');
    mocks.claimLocalDataOwner.mockResolvedValue('unchanged');
  });

  function setSnapshot(accountId: string | undefined) {
    const snapshot = {
      _id: 'snap-1',
      createdAt: Date.now(),
      accountId,
      fullBackupData: { expenses: [] },
    };
    mocks.useQuery.mockImplementation((ref: unknown) => {
      if (ref === api.snapshots.getLatestSnapshot) return snapshot;
      if (ref === api.feedback.getCurrentUser) {
        return { tokenIdentifier: 'user-1', name: 'Tester' };
      }
      return undefined;
    });
  }

  it('skips a cloud snapshot that belongs to a different account', async () => {
    setSnapshot('acc-other');
    render(<AccountSyncMount />);
    await waitFor(() => expect(mocks.claimLocalDataOwner).toHaveBeenCalled());
    await wait(50);

    expect(mocks.restore).not.toHaveBeenCalled();
  });

  it('auto-restores a cloud snapshot that matches the active account', async () => {
    setSnapshot('personal');
    render(<AccountSyncMount />);
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledTimes(1));
  });
});
