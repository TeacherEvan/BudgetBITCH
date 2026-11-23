// src/hooks/use-line-link.test.tsx
// Tests for the LIFF account-link hook (Task 6 of the LINE receipt-bot plan).
//
// The LIFF SDK is loaded on demand from LINE's CDN in the browser; here we
// install a fake `window.liff` and assert the hook drives it correctly.
// W7: after LIFF login the hook reveals a manual code entry; `link()` only
// calls linkLineAccount once the user supplies the bot-issued code.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConvexError } from 'convex/values';
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

async function startLink(result: { current: ReturnType<typeof useLineLink> }) {
  await act(async () => {
    await result.current.start();
  });
}

async function setCode(result: { current: ReturnType<typeof useLineLink> }, code: string) {
  await act(async () => {
    result.current.setCode(code);
  });
}

async function submitLink(result: { current: ReturnType<typeof useLineLink> }) {
  await act(async () => {
    await result.current.link();
  });
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

    await startLink(result);

    const liff = getLiff();
    await waitFor(() => expect(liff.login).toHaveBeenCalledTimes(1));
    expect(liff.getProfile).not.toHaveBeenCalled();
    expect(linkAccount).not.toHaveBeenCalled();
  });

  // (b) After LIFF login + profile read, the hook exposes the LINE user id so
  //     the page can show the manual code input. No mutation yet.
  it('reads the LIFF userId into state without linking before a code is entered', async () => {
    installLiff('Utest123', true);

    const { result } = renderHook(() => useLineLink());

    await startLink(result);

    await waitFor(() => expect(result.current.lineUserId).toBe('Utest123'));
    expect(result.current.status).toBe('idle');
    expect(result.current.code).toBe('');
    expect(linkAccount).not.toHaveBeenCalled();
  });

  // (c) The entered bot-issued code is passed to linkLineAccount together with
  //     the LIFF userId (and optional accountId).
  it('passes the entered code to linkLineAccount on link()', async () => {
    installLiff('Utest123', true);

    const { result } = renderHook(() => useLineLink());

    await startLink(result);
    await setCode(result, '  BOT-CODE-1  ');
    await submitLink(result);

    await waitFor(() => expect(linkAccount).toHaveBeenCalledTimes(1));
    expect(linkAccount).toHaveBeenCalledWith({
      lineUserId: 'Utest123',
      code: 'BOT-CODE-1',
      accountId: undefined,
    });
    expect(result.current.status).toBe('linked');
  });

  it('passes the optional accountId through to the mutation', async () => {
    installLiff('Uacct', true);

    const { result } = renderHook(() => useLineLink('acc-9'));

    await startLink(result);
    await setCode(result, 'acct-code');
    await submitLink(result);

    await waitFor(() => expect(linkAccount).toHaveBeenCalledTimes(1));
    expect(linkAccount).toHaveBeenCalledWith({
      lineUserId: 'Uacct',
      code: 'acct-code',
      accountId: 'acc-9',
    });
  });

  // (d) A missing/blank code is rejected locally, before any network call.
  it('does not call the mutation and surfaces a validation error when code is missing', async () => {
    installLiff('Utest123', true);

    const { result } = renderHook(() => useLineLink());

    await startLink(result);
    await setCode(result, '   ');
    await submitLink(result);

    expect(linkAccount).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/enter the code/i);
  });

  // W3 ConvexError messages must be mapped to actionable UI copy.
  it('surfaces the ConvexError message for an invalid or expired code', async () => {
    installLiff('Utest123', true);
    linkAccount.mockRejectedValue(
      new ConvexError('Invalid or expired LINE link code'),
    );

    const { result } = renderHook(() => useLineLink());

    await startLink(result);
    await setCode(result, 'expired-code');
    await submitLink(result);

    expect(linkAccount).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/invalid or has expired/i);
  });

  it('surfaces the ConvexError message when the code belongs to another LINE user', async () => {
    installLiff('Utest123', true);
    linkAccount.mockRejectedValue(
      new ConvexError('This LINE account is already linked to another user'),
    );

    const { result } = renderHook(() => useLineLink());

    await startLink(result);
    await setCode(result, 'wrong-user-code');
    await submitLink(result);

    expect(result.current.error).toMatch(/already linked to another user/i);
  });

  it('surfaces an error when LIFF init throws', async () => {
    (window as unknown as { liff: unknown }).liff = {
      init: vi.fn().mockRejectedValue(new Error('init failed')),
      getProfile: vi.fn(),
      isLoggedIn: () => false,
      login: vi.fn(),
    };

    const { result } = renderHook(() => useLineLink());

    await startLink(result);

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toMatch(/init failed/);
    expect(linkAccount).not.toHaveBeenCalled();
  });

  it('does not submit twice while a link attempt is in flight', async () => {
    installLiff('Utest123', true);
    let resolveMutation: (value: string) => void = () => undefined;
    linkAccount.mockImplementation(
      () => new Promise<string>((resolve) => { resolveMutation = resolve; }),
    );

    const { result } = renderHook(() => useLineLink());

    await startLink(result);
    await setCode(result, 'single-flight');

    await act(async () => {
      void result.current.link();
      await result.current.link();
    });
    expect(linkAccount).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveMutation('line_doc_id');
    });
    await waitFor(() => expect(result.current.status).toBe('linked'));
  });
});
