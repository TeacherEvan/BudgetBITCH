// app/join/join.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useConvexAuth } from '@convex-dev/auth/react';

const redeemInviteToken = vi.fn(async () => ({ accountId: 'acc-1', boardId: 'board-1' }));
const push = vi.fn();
const replace = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams('code=TOKENXYZ'),
}));
vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({ redeemInviteToken }),
}));
vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false, fetchAccessToken: async () => null })),
}));
vi.mock('@/hooks/use-account-sync', () => ({ useAccountSync: () => ({}) }));
vi.mock('@/components/layout/header-bar', () => ({
  HeaderBar: () => <div data-testid="header" />,
}));

import JoinPage from './page';

describe('JoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redeems the token from ?code= and lands on the joined account', async () => {
    vi.mocked(useConvexAuth).mockReturnValue({ isAuthenticated: true, isLoading: false, fetchAccessToken: async () => null });
    render(<JoinPage />);
    await waitFor(() => expect(redeemInviteToken).toHaveBeenCalledWith('TOKENXYZ'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('redirects unauthenticated users to sign-in, preserving the ?code', async () => {
    vi.mocked(useConvexAuth).mockReturnValue({ isAuthenticated: false, isLoading: false, fetchAccessToken: async () => null });
    render(<JoinPage />);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    const target = replace.mock.calls[0][0] as string;
    expect(target).toContain('/sign-in');
    expect(target).toContain('redirectTo=' + encodeURIComponent('/join?code=TOKENXYZ'));
    // Never calls the mutation while logged out.
    expect(redeemInviteToken).not.toHaveBeenCalled();
  });
});
