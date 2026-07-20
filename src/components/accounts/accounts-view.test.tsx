// components/accounts/accounts-view.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

const createAccount = vi.fn(async () => ({ accountId: 'acc-new', boardId: 'board-new' }));
const switchTo = vi.fn(async () => {});
const createInviteToken = vi.fn(async () => 'TOKENXYZ');
const leaveAccount = vi.fn(async () => {});
const deleteAccount = vi.fn(async () => {});

vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({
    accounts: [
      { accountId: 'personal', umbrella: 'personal', name: 'Personal', boardId: null, inviteCode: null, role: 'owner', hasLocalData: true, memberCount: 1 },
      { accountId: 'acc-1', umbrella: 'family', name: 'Our Family', boardId: 'board-1', inviteCode: 'ABC123', role: 'owner', hasLocalData: true, memberCount: 3 },
    ],
    currentAccountId: 'personal',
    loading: false,
    ready: true,
    createAccount,
    switchTo,
    createInviteToken,
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    leaveAccount,
    removeMember: vi.fn(),
    renameAccount: vi.fn(),
    deleteAccount,
    refresh: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-account-sync', () => ({ useAccountSync: () => ({}) }));
vi.mock('@/components/layout/header-bar', () => ({
  HeaderBar: () => <div data-testid="header" />,
}));

import { AccountsView } from './accounts-view';

describe('AccountsView', () => {
  it('renders accounts and a new-account action', () => {
    render(<AccountsView locale="en" />);
    expect(screen.getByText('Our Family')).toBeTruthy();
    expect(screen.getByRole('button', { name: /new account/i })).toBeTruthy();
  });

  it('opens the create modal, picks an umbrella + name, and creates', async () => {
    render(<AccountsView locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: /new account/i }));
    // Pick the Business umbrella.
    fireEvent.click(screen.getByRole('button', { name: /business/i }));
    const nameInput = screen.getByPlaceholderText(/account name/i);
    fireEvent.change(nameInput, { target: { value: 'Work Expenses' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(createAccount).toHaveBeenCalledWith({ umbrella: 'business', name: 'Work Expenses' });
  });

  it('invite section generates a token + shows QR for an owned account', async () => {
    render(<AccountsView locale="en" />);
    // Expand the invite panel for the owned account (generates a token).
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));
    // The generated token should be surfaced (waits for async generate).
    expect(await screen.findByText('TOKENXYZ')).toBeTruthy();
    // A QR code (svg) should be rendered.
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('owner delete button opens a confirm dialog that calls deleteAccount', async () => {
    render(<AccountsView locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    // Confirm delete.
    fireEvent.click(within(dialog as HTMLElement).getByRole('button', { name: /delete/i }));
    expect(deleteAccount).toHaveBeenCalledWith('acc-1');
  });
});
