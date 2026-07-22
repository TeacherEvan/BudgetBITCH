// app/join/join.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const redeemInviteToken = vi.fn(async () => ({ accountId: 'acc-1', boardId: 'board-1' }));
const push = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('code=TOKENXYZ'),
}));
vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({ redeemInviteToken }),
}));
vi.mock('@/hooks/use-account-sync', () => ({ useAccountSync: () => ({}) }));
vi.mock('@/components/layout/header-bar', () => ({
  HeaderBar: () => <div data-testid="header" />,
}));

import JoinPage from './page';

describe('JoinPage', () => {
  it('redeems the token from ?code= and lands on the joined account', async () => {
    render(<JoinPage />);
    await waitFor(() => expect(redeemInviteToken).toHaveBeenCalledWith('TOKENXYZ'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });
});
