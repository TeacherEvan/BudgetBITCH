// components/accounts/account-switcher.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AccountView } from '@/hooks/use-accounts';

const switchTo = vi.fn(async () => {});
const refresh = vi.fn();
const fakeAccounts: AccountView[] = [
  { accountId: 'personal', umbrella: 'personal', name: 'Personal', boardId: null, inviteCode: null, role: 'owner', hasLocalData: true, memberCount: 1 },
  { accountId: 'acc-1', umbrella: 'family', name: 'Our Family', boardId: 'board-1', inviteCode: 'ABC123', role: 'owner', hasLocalData: true, memberCount: 3 },
];

vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({
    accounts: fakeAccounts,
    currentAccountId: 'personal',
    loading: false,
    ready: true,
    switchTo,
    refresh,
    createAccount: vi.fn(),
    inviteByCode: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    leaveAccount: vi.fn(),
    removeMember: vi.fn(),
    renameAccount: vi.fn(),
  }),
}));

import { AccountSwitcher } from './account-switcher';

describe('AccountSwitcher', () => {
  it('renders the active account name', () => {
    render(<AccountSwitcher locale="en" />);
    expect(screen.getByText('Personal')).toBeTruthy();
  });

  it('opening the menu lists all accounts and switches on click', () => {
    render(<AccountSwitcher locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: /switch account/i }));
    const familyOption = screen.getByText('Our Family');
    fireEvent.click(familyOption);
    expect(switchTo).toHaveBeenCalledWith('acc-1');
  });
});
