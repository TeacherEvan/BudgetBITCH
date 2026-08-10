// hooks/use-purchase-notes.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePurchaseNotes } from './use-purchase-notes';

// Deterministic tokens so we can match which Convex function a useMutation
// call refers to (the real `api` is a Proxy, so reference equality fails).
vi.mock('../../convex/_generated/api', () => ({
  api: {
    accounts: {
      purchaseNotes: {
        setPurchaseNote: 'setPurchaseNote',
        deletePurchaseNote: 'deletePurchaseNote',
        getPurchaseNotes: 'getPurchaseNotes',
      },
    },
  },
}));

const mockGetPurchaseNotes = vi.fn();
const mockSetPurchaseNote = vi.fn();
const mockDeletePurchaseNote = vi.fn();

vi.mock('convex/react', () => ({
  useConvex: () => ({}),
  useMutation: (fn: unknown) => {
    if (fn === 'setPurchaseNote') return mockSetPurchaseNote;
    if (fn === 'deletePurchaseNote') return mockDeletePurchaseNote;
    return vi.fn();
  },
  useQuery: (fn: unknown, args: unknown) => {
    if (fn !== 'getPurchaseNotes') return undefined;
    if (args === 'skip') return undefined;
    return mockGetPurchaseNotes();
  },
}));

vi.mock('@/lib/db/accountStorage', () => ({
  getCurrentAccountId: vi.fn(),
  getLocalAccounts: vi.fn(),
}));

import { getCurrentAccountId, getLocalAccounts } from '@/lib/db/accountStorage';
import type { LocalAccountMeta } from '@/lib/types/accounts';

const sharedMeta: LocalAccountMeta = {
  accountId: 'board_abc',
  umbrella: 'couple',
  name: 'Our Board',
  boardId: 'board_xyz',
  inviteCode: 'XYZ',
  role: 'owner',
};

describe('usePurchaseNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPurchaseNotes.mockReturnValue({ e1: { note: 'Existing', updatedBy: 'u1', updatedAt: 1 } });
  });

  it('resolves the active shared board and returns its notes', async () => {
    (getCurrentAccountId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('board_abc');
    (getLocalAccounts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([sharedMeta]);

    const { result } = renderHook(() => usePurchaseNotes());

    await waitFor(() => expect(result.current.boardId).toBe('board_xyz'));
    expect(result.current.notes).toEqual({ e1: { note: 'Existing', updatedBy: 'u1', updatedAt: 1 } });
  });

  it('returns null boardId for the personal board (no shared notes)', async () => {
    (getCurrentAccountId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('personal');

    const { result } = renderHook(() => usePurchaseNotes());

    await waitFor(() => expect(result.current.boardId).toBeNull());
    expect(result.current.notes).toEqual({});
  });

  it('writes a note through the Convex mutation', async () => {
    (getCurrentAccountId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('board_abc');
    (getLocalAccounts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([sharedMeta]);
    mockSetPurchaseNote.mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePurchaseNotes());
    await waitFor(() => expect(result.current.boardId).toBe('board_xyz'));

    await act(async () => {
      await result.current.setNote('e2', 'Client lunch');
    });

    expect(mockSetPurchaseNote).toHaveBeenCalledWith({
      boardId: 'board_xyz',
      expenseId: 'e2',
      note: 'Client lunch',
    });
  });

  it('deletes a note through the Convex mutation', async () => {
    (getCurrentAccountId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('board_abc');
    (getLocalAccounts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([sharedMeta]);
    mockDeletePurchaseNote.mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePurchaseNotes());
    await waitFor(() => expect(result.current.boardId).toBe('board_xyz'));

    await act(async () => {
      await result.current.deleteNote('e1');
    });

    expect(mockDeletePurchaseNote).toHaveBeenCalledWith({
      boardId: 'board_xyz',
      expenseId: 'e1',
    });
  });
});
