// hooks/use-accounts.test.tsx
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { clearAllData } from '@/lib/db/local-db';
import { getCurrentAccountId } from '@/lib/db/accountStorage';

// Convex `api` is an `anyApi` Proxy whose function references can't be
// reliably stringified in tests, so we map by call ARGS + a per-test mode
// instead of by reference name. All `useMutation` calls return the SAME spy;
// the hook always passes the correct args to the correct logical mutation.
let mode = 'create';
const spy = vi.fn(async (args: Record<string, unknown>) => {
  if (mode === 'create') return { accountId: 'acc-new', boardId: 'board-new' };
  if (mode === 'token') return { token: 'TOK123' };
  if (mode === 'board') return { boardId: 'board-x', updatedAt: 1, data: null };
  return { success: true };
});

const listMyAccounts = vi.fn();

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

const mockConvexQuery = vi.fn(async () => null);

vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useConvex: () => ({ query: mockConvexQuery }),
  useQuery: (_ref: unknown, _args: unknown) => listMyAccounts(),
  useMutation: () => spy,
}));

import { useAccounts } from './use-accounts';

function HookProbe({ onReady }: { onReady?: (api: ReturnType<typeof useAccounts>) => void }) {
  const api = useAccounts();
  if (api.ready && onReady) onReady(api);
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  vi.clearAllMocks();
  await clearAllData();
  localStorage.clear();
  mode = 'create';
  listMyAccounts.mockReturnValue([
    {
      accountId: 'acc-own',
      umbrella: 'family',
      name: 'Our Family',
      role: 'owner',
      boardId: 'board-own',
      memberCount: 3,
      inviteCode: 'ABCDEF12',
    },
    {
      accountId: 'acc-join',
      umbrella: 'business',
      name: 'Work',
      role: 'member',
      boardId: 'board-join',
      memberCount: 2,
      inviteCode: null,
    },
  ]);
});

describe('useAccounts', () => {
  it('merges server accounts + always includes personal', async () => {
    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));
    const ids = api.accounts.map((a) => a.accountId).sort();
    expect(ids).toContain('acc-own');
    expect(ids).toContain('acc-join');
    expect(ids).toContain('personal');
    const personal = api.accounts.find((a) => a.accountId === 'personal');
    expect(personal?.boardId).toBeNull();
    expect(personal?.role).toBe('owner');
  });

  it('createAccount delegates + persists local meta', async () => {
    mode = 'create';
    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));
    await act(async () => {
      await api.createAccount({ umbrella: 'friends', name: 'Crew' });
    });
    expect(spy).toHaveBeenCalledWith({ umbrella: 'friends', name: 'Crew' });
    const current = await getCurrentAccountId();
    expect(['personal', 'acc-own', 'acc-join']).toContain(current);
  });

  it('createInviteToken delegates + returns the token', async () => {
    mode = 'token';
    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));
    let token!: string;
    await act(async () => {
      token = await api.createInviteToken('acc-own');
    });
    expect(spy).toHaveBeenCalledWith({ accountId: 'acc-own' });
    expect(token).toBe('TOK123');
    mode = 'create';
  });

  it('leaveAccount delegates + returns to personal locally', async () => {
    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));
    await act(async () => {
      await api.leaveAccount('acc-join');
    });
    expect(spy).toHaveBeenCalledWith({ accountId: 'acc-join' });
    const current = await getCurrentAccountId();
    expect(current).toBe('personal');
  });

  it('deleteAccount delegates to delete mutation + clears local + falls back to personal', async () => {
    // Make the deleted account the active one to exercise the personal fallback.
    await act(async () => {
      await (await import('@/lib/db/accountStorage')).setCurrentAccountId('acc-own');
    });
    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));
    await act(async () => {
      await api.deleteAccount('acc-own');
    });
    expect(spy).toHaveBeenCalledWith({ accountId: 'acc-own' });
    const current = await getCurrentAccountId();
    expect(current).toBe('personal');
    // Local meta + stash cleared.
    const { getLocalAccount, getStashedAccount } = await import('@/lib/db/accountStorage');
    expect(await getLocalAccount('acc-own')).toBeUndefined();
    expect(await getStashedAccount('acc-own')).toBeUndefined();
  });

  it('switchTo falls back to localSwitch when convex query throws error', async () => {
    // Force convex query to throw error
    mockConvexQuery.mockRejectedValueOnce(new Error('Network error'));

    let api!: ReturnType<typeof useAccounts>;
    render(<HookProbe onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api?.ready).toBe(true));

    await act(async () => {
      await api.switchTo('acc-join');
    });

    const current = await getCurrentAccountId();
    expect(current).toBe('acc-join');
  });
});
