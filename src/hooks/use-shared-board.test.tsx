// hooks/use-shared-board.test.tsx
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import { saveWizardProfile, getWizardProfile, clearAllData } from '@/lib/db/local-db';
import type { WizardProfile } from '@/lib/types/budget';

// Control the values the hook reads from useQuery.
let queryResults: Record<string, unknown> = {};
const pushBoard = vi.fn(async () => ({ success: true, applied: true }));
const resolveShareCode = vi.fn(async () => ({ exists: true, displayName: null }));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock('convex/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useConvex: () => ({
    query: async (_ref: unknown, args: Record<string, unknown>) =>
      resolveShareCode(args),
  }),
  useMutation: () => {
    // Convex returns stable references across renders; return a stable mock.
    // For this hook test only pushBoard is asserted, so all slots reuse it.
    return pushBoard;
  },
  useQuery: (_ref: unknown, args: unknown) => {
    const isBoard = args !== null && typeof args === 'object' && 'boardId' in (args as object);
    const isSkip = args === 'skip';
    if (!isBoard && !isSkip) {
      return queryResults.getMyProfile ?? null;
    }
    return queryResults.getBoard ?? null;
  },
}));

import { useSharedBoard } from './use-shared-board';

function HookProbe() {
  useSharedBoard();
  return null;
}

function makeProfile(): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income: 50000,
      rent: 8000,
      transport: 2000,
      phoneInternet: 1000,
      subscriptions: 500,
      entertainment: 1500,
      healthcare: 1000,
      savingsRatePct: 10,
      riskTolerance: 'medium',
      locationConsent: false,
      currency: 'THB',
    },
  };
}

type FixtureBoard = {
  boardId: string;
  updatedAt: number;
  data: Record<string, { value: unknown; updatedAt: number }> | null;
  _id?: string;
  memberA?: string;
  memberB?: string;
  updatedBy?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  queryResults = {
    getMyProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: null },
    getBoard: null,
  };
  pushBoard.mockClear();
  resolveShareCode.mockClear();
  await clearAllData();
  localStorage.clear();
});

describe('useSharedBoard', () => {
  it('pulls a newer remote board into local storage', async () => {
    await saveWizardProfile(makeProfile());
    expect((await getWizardProfile())?.answers.income).toBe(50000);

    const result = render(<HookProbe />);

    const remoteBoard: FixtureBoard = {
      _id: 'b1',
      boardId: 'board_1',
      memberA: 'u1',
      memberB: 'u2',
      data: {
        'wizardProfile:current': {
          value: {
            ...makeProfile(),
            answers: { ...makeProfile().answers, income: 999999 },
          },
          updatedAt: Date.now() + 5_000_000,
        },
      },
      updatedAt: Date.now() + 5_000_000,
      updatedBy: 'u2',
    };

    await act(async () => {
      queryResults = {
        getMyProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: 'board_1' },
        getBoard: remoteBoard,
      };
      result.rerender(<HookProbe />);
      await sleep(50);
    });

    await waitFor(async () => {
      const local = await getWizardProfile();
      expect(local?.answers.income).toBe(999999);
    });
  });

  it('debounces rapid local edits into a single push', async () => {
    queryResults = {
      getMyProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: 'board_1' },
      getBoard: { boardId: 'board_1', updatedAt: 100, data: null } as FixtureBoard,
    };
    render(<HookProbe />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).toHaveBeenCalledTimes(1);
    const firstCall = (pushBoard.mock.calls[0] as unknown[])[0] as { boardId: string };
    expect(firstCall.boardId).toBe('board_1');
  });

  it('queues an offline edit to localStorage instead of pushing', async () => {
    queryResults = {
      getMyProfile: { shareCode: 'ABCD1234', displayName: null, linkedBoardId: 'board_1' },
      getBoard: { boardId: 'board_1', updatedAt: 100, data: null } as FixtureBoard,
    };
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    render(<HookProbe />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
      await sleep(1000);
    });

    expect(pushBoard).not.toHaveBeenCalled();
    const queue = JSON.parse(localStorage.getItem('budgetbitch:boardQueue') || '[]');
    expect(queue).toHaveLength(1);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await sleep(50);
    });
    expect(pushBoard).toHaveBeenCalledTimes(1);
  });
});
