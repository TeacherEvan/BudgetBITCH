// src/hooks/use-line-link.test.tsx
// Tests for the LIFF account-link hook (Task 6 of the LINE receipt-bot plan).
//
// The LIFF SDK is loaded on demand from LINE's CDN in the browser; here we
// install a fake `window.liff` and assert the hook drives it correctly.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const linkAccount = vi.fn().mockResolvedValue('line_doc_id');

vi.mock('convex/react', () => ({
  useMutation: () => linkAccount,
  useQuery: () => null,
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

import { useLineLink } from './use-line-link';

// Install a fake LIFF global so the hook can init + read a profile.
function installLiff(userId: string, isLoggedIn = true) {
  (window as unknown as { liff: unknown }).liff = {
    init: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn().mockResolvedValue({ userId, displayName: 'Tester' }),
    isLoggedIn: () => isLoggedIn,
    login: vi.fn(),
  };
}

function getLiff() {
  return (window as unknown as { liff: {
    init: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
    isLoggedIn: () => boolean;
    login: ReturnType<typeof vi.fn>;
  } }).liff;
}

describe('useLineLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { liff?: unknown }).liff;
    process.env.NEXT_PUBLIC_LINE_LIFF_ID = 'test-liff-id';
    linkAccount.mockResolvedValue('line_doc_id');
  });

  // (a) When the user is not logged in to LINE, the hook must trigger the
  //     LIFF login redirect and must NOT attempt to read a profile or link.
  it('calls liff.login() when not logged in', async () => {
    installLiff('Utest123', false);

    const { result } = renderHook(() => useLineLink());

    await act(async () => {
      await result.current.link();
    });

    const liff = getLiff();
    await waitFor(() => expect(liff.login).toHaveBeenCalledTimes(1));
    expect(liff.getProfile).not.toHaveBeenCalled();
    expect(linkAccount).not.toHaveBeenCalled();
  });

  // (b) After login + profile read, linkLineAccount is called with the LIFF
  //     userId (and optional accountId).
  it('calls linkLineAccount with the LIFF userId on link()', async () => {
    installLiff('Utest123', true);

    const { result } = renderHook(() => useLineLink());

    await act(async () => {
      await result.current.link();
    });

    await waitFor(() => expect(linkAccount).toHaveBeenCalledTimes(1));
    expect(linkAccount).toHaveBeenCalledWith({
      lineUserId: 'Utest123',
      accountId: undefined,
    });
  });

  it('passes the optional accountId through to the mutation', async () => {
    installLiff('Uacct', true);

    const { result } = renderHook(() => useLineLink('acc-9'));

    await act(async () => {
      await result.current.link();
    });

    await waitFor(() => expect(linkAccount).toHaveBeenCalledTimes(1));
    expect(linkAccount).toHaveBeenCalledWith({
      lineUserId: 'Uacct',
      accountId: 'acc-9',
    });
  });

  // (c) Success sets status 'linked'.
  it('sets status to linked after a successful link', async () => {
    installLiff('Utest123', true);

    const { result } = renderHook(() => useLineLink());

    await act(async () => {
      await result.current.link();
    });

    await waitFor(() => expect(result.current.status).toBe('linked'));
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error when LIFF init throws', async () => {
    (window as unknown as { liff: unknown }).liff = {
      init: vi.fn().mockRejectedValue(new Error('init failed')),
      getProfile: vi.fn(),
      isLoggedIn: () => false,
      login: vi.fn(),
    };

    const { result } = renderHook(() => useLineLink());

    await act(async () => {
      await result.current.link();
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/init failed/);
    expect(linkAccount).not.toHaveBeenCalled();
  });
});
