// hooks/use-shared-delete-guard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedDeleteGuard } from './use-shared-delete-guard';

// Stable, identifiable reference objects (hoisted above vi.mock factories). The
// generated Convex FunctionReferences are bare {} so we supply our own to branch
// the convex/react useMutation mock by identity.
const refs = vi.hoisted(() => ({
  request: { __fn: 'requestItemDelete' },
  approve: { __fn: 'approveItemDelete' },
  reject: { __fn: 'rejectItemDelete' },
  list: { __fn: 'listPendingDeletes' },
}));

const mockRequest = vi.fn().mockResolvedValue({ pendingId: 'p1' });
const mockApprove = vi.fn().mockResolvedValue({ approved: true });
const mockReject = vi.fn().mockResolvedValue({ rejected: true });

vi.mock('../../convex/_generated/api', () => ({
  api: {
    pendingDeletes: {
      requestItemDelete: refs.request,
      approveItemDelete: refs.approve,
      rejectItemDelete: refs.reject,
      listPendingDeletes: refs.list,
    },
  },
}));

vi.mock('convex/react', () => {
  // Stable reference so the hook's effect doesn't loop on a new array each render.
  const pendingRows = [
    {
      pendingId: 'p_partner',
      boardId: 'b1',
      store: 'expenses',
      itemId: 'e1',
      itemSnapshot: { merchant: 'Grab', amount: 120 },
      requestedAt: 1000,
      canAct: true,
      isRequester: false,
    },
    {
      pendingId: 'p_mine',
      boardId: 'b1',
      store: 'incomes',
      itemId: 'i1',
      itemSnapshot: { merchant: 'Salary', amount: 50000 },
      requestedAt: 2000,
      canAct: false,
      isRequester: true,
    },
  ];
  return {
    useMutation: (fn: unknown) => {
      if (fn === refs.request) return mockRequest;
      if (fn === refs.approve) return mockApprove;
      if (fn === refs.reject) return mockReject;
      return vi.fn();
    },
    useQuery: (_ref: unknown, args: unknown) => {
      if (args === 'skip') return undefined;
      return pendingRows;
    },
  };
});

describe('useSharedDeleteGuard', () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockApprove.mockClear();
    mockReject.mockClear();
  });

  it('routes a delete request to the server mutation when shared', async () => {
    const { result } = renderHook(() => useSharedDeleteGuard('b1', true));
    await act(async () => {
      await result.current.requestDelete('expenses', 'e1', { merchant: 'Grab' });
    });
    expect(mockRequest).toHaveBeenCalledWith({
      boardId: 'b1',
      store: 'expenses',
      itemId: 'e1',
      itemSnapshot: { merchant: 'Grab' },
    });
  });

  it('throws when not shared (caller must delete locally)', async () => {
    const { result } = renderHook(() => useSharedDeleteGuard(null, false));
    await expect(result.current.requestDelete('expenses', 'e1')).rejects.toThrow(/Not a shared board/);
  });

  it('splits pending into pendingForMe (partner) and pendingByMe (self)', async () => {
    const { result } = renderHook(() => useSharedDeleteGuard('b1', true));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.pendingForMe).toHaveLength(1);
    expect(result.current.pendingForMe[0].pendingId).toBe('p_partner');
    expect(result.current.pendingByMe).toHaveLength(1);
    expect(result.current.pendingByMe[0].pendingId).toBe('p_mine');
  });

  it('exposes approve/reject that call the server mutations', async () => {
    const { result } = renderHook(() => useSharedDeleteGuard('b1', true));
    await act(async () => {
      await result.current.approve('p_partner');
      await result.current.reject('p_mine');
    });
    expect(mockApprove).toHaveBeenCalledWith({ pendingId: 'p_partner' });
    expect(mockReject).toHaveBeenCalledWith({ pendingId: 'p_mine' });
  });
});
