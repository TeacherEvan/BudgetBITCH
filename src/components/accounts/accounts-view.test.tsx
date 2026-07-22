// components/accounts/accounts-view.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import type { AccountView } from '@/hooks/use-accounts';
import { MAX_OWNED_ACCOUNTS } from '@/lib/types/accounts';
import { AccountsView } from './accounts-view';

const mockCreateAccount = vi.fn();
const mockSwitchTo = vi.fn();
const mockCreateInviteToken = vi.fn();
const mockLeaveAccount = vi.fn();
const mockDeleteAccount = vi.fn();
const mockRefresh = vi.fn();

let mockAccounts: AccountView[] = [];
let mockCurrentAccountId = 'personal';
let mockLoading = false;
let mockReady = true;
let mockIsAuthenticated = true;

vi.mock('@/hooks/use-accounts', () => ({
  useAccounts: () => ({
    accounts: mockAccounts,
    currentAccountId: mockCurrentAccountId,
    loading: mockLoading,
    ready: mockReady,
    createAccount: mockCreateAccount,
    switchTo: mockSwitchTo,
    createInviteToken: mockCreateInviteToken,
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    leaveAccount: mockLeaveAccount,
    removeMember: vi.fn(),
    renameAccount: vi.fn(),
    deleteAccount: mockDeleteAccount,
    refresh: mockRefresh,
  }),
}));

vi.mock('@convex-dev/auth/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-account-sync', () => ({
  useAccountSync: () => ({}),
}));

vi.mock('@/components/layout/header-bar', () => ({
  HeaderBar: () => <div data-testid="header-bar" />,
}));

describe('AccountsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentAccountId = 'personal';
    mockLoading = false;
    mockReady = true;
    mockIsAuthenticated = true;
    mockAccounts = [
      {
        accountId: 'personal',
        umbrella: 'personal',
        name: 'Personal',
        boardId: null,
        inviteCode: null,
        role: 'owner',
        hasLocalData: true,
        memberCount: 1,
      },
      {
        accountId: 'acc-family',
        umbrella: 'family',
        name: 'Our Family',
        boardId: 'board-family',
        inviteCode: 'FAM123',
        role: 'owner',
        hasLocalData: true,
        memberCount: 3,
      },
      {
        accountId: 'acc-biz',
        umbrella: 'business',
        name: 'Tech Startup',
        boardId: 'board-biz',
        inviteCode: 'BIZ456',
        role: 'member',
        hasLocalData: true,
        memberCount: 5,
      },
    ];
  });

  // 1. Test rendering list of owned and joined accounts with umbrella labels and role badges
  it('renders list of owned and joined accounts with umbrella labels, taglines, active indicators, and role badges', () => {
    render(<AccountsView locale="en" />);

    // Check account names
    expect(screen.getByText('Personal')).toBeTruthy();
    expect(screen.getByText('Our Family')).toBeTruthy();
    expect(screen.getByText('Tech Startup')).toBeTruthy();

    // Check role badges ('Owner' and 'Member')
    const ownerBadges = screen.getAllByText(/Owner\s*·/i);
    expect(ownerBadges.length).toBe(2); // Personal & Our Family
    const memberBadges = screen.getAllByText(/Member\s*·/i);
    expect(memberBadges.length).toBe(1); // Tech Startup

    // Check member counts
    expect(screen.getByText(/1 member\b/i)).toBeTruthy();
    expect(screen.getByText(/3 members/i)).toBeTruthy();
    expect(screen.getByText(/5 members/i)).toBeTruthy();

    // Check umbrella taglines/labels
    expect(screen.getByText('Your private board')).toBeTruthy();
    expect(screen.getByText('Household bills + family goals')).toBeTruthy();
    expect(screen.getByText('Revenue, expenses + tax')).toBeTruthy();

    // Check Active status indicator on the active board
    expect(screen.getByText('Active')).toBeTruthy();
  });

  // 2. Test account creation modal: clicking "New account" opens modal, selecting category + entering name enables creation, submitting calls createAccount()
  it('opens creation modal, enables creation when umbrella & name are selected, and calls createAccount() on submit', async () => {
    mockCreateAccount.mockResolvedValue({ accountId: 'new-acc-id', boardId: 'new-board-id' });

    render(<AccountsView locale="en" />);

    const newAccountBtn = screen.getByRole('button', { name: /new account/i });
    fireEvent.click(newAccountBtn);

    // Verify modal title and instructions appear
    expect(screen.getByText('Pick an umbrella, then name this account.')).toBeTruthy();

    const submitBtn = screen.getByRole('button', { name: /^create$/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Select the "Family" umbrella
    const familyUmbrellaBtn = screen.getByRole('button', { name: /family/i });
    fireEvent.click(familyUmbrellaBtn);

    // Submit should still be disabled because name is empty
    expect(submitBtn.disabled).toBe(true);

    // Enter an account name
    const nameInput = screen.getByPlaceholderText(/account name/i);
    fireEvent.change(nameInput, { target: { value: 'Vacation Budget' } });

    // Submit button should now be enabled
    expect(submitBtn.disabled).toBe(false);

    // Click submit
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockCreateAccount).toHaveBeenCalledWith({
      umbrella: 'family',
      name: 'Vacation Budget',
    });
  });

  // 3. Test account limit boundaries: verify "New account" button is disabled when owned accounts count reaches MAX_OWNED_ACCOUNTS (5 accounts)
  it('enables "New account" button when owned accounts < MAX_OWNED_ACCOUNTS and disables it when limit (5) is reached', () => {
    // 4 owned non-personal accounts + 1 personal account -> ownedCount = 4 < MAX_OWNED_ACCOUNTS (5)
    mockAccounts = [
      { accountId: 'personal', umbrella: 'personal', name: 'Personal', boardId: null, inviteCode: null, role: 'owner', hasLocalData: true, memberCount: 1 },
      ...Array.from({ length: 4 }).map((_, i) => ({
        accountId: `acc-${i}`,
        umbrella: 'family' as const,
        name: `Owned Acc ${i + 1}`,
        boardId: `board-${i}`,
        inviteCode: `CODE${i}`,
        role: 'owner' as const,
        hasLocalData: true,
        memberCount: 2,
      })),
    ];

    const { rerender } = render(<AccountsView locale="en" />);
    let newAccountBtn = screen.getByRole('button', { name: /new account/i }) as HTMLButtonElement;
    expect(newAccountBtn.disabled).toBe(false);

    // 5 owned non-personal accounts -> ownedCount = 5 === MAX_OWNED_ACCOUNTS
    mockAccounts = [
      { accountId: 'personal', umbrella: 'personal', name: 'Personal', boardId: null, inviteCode: null, role: 'owner', hasLocalData: true, memberCount: 1 },
      ...Array.from({ length: MAX_OWNED_ACCOUNTS }).map((_, i) => ({
        accountId: `acc-${i}`,
        umbrella: 'family' as const,
        name: `Owned Acc ${i + 1}`,
        boardId: `board-${i}`,
        inviteCode: `CODE${i}`,
        role: 'owner' as const,
        hasLocalData: true,
        memberCount: 2,
      })),
    ];

    rerender(<AccountsView locale="en" />);
    newAccountBtn = screen.getByRole('button', { name: /new account/i }) as HTMLButtonElement;
    expect(newAccountBtn.disabled).toBe(true);
  });

  // 4. Test switching accounts: clicking "Open" on an account triggers switchTo(accountId)
  it('triggers switchTo(accountId) when clicking "Open" on an inactive account', () => {
    render(<AccountsView locale="en" />);

    // Target the inactive "Our Family" account card specifically
    const familyCard = screen.getByText('Our Family').closest('div.rounded-2xl')!;
    const openBtn = within(familyCard as HTMLElement).getByRole('button', { name: /open/i });

    fireEvent.click(openBtn);
    expect(mockSwitchTo).toHaveBeenCalledWith('acc-family');
  });

  // 5. Test invite token generation: clicking "Invite" triggers createInviteToken(), opens modal/panel with QR code and invite link
  it('triggers createInviteToken(), renders QR code and invite link when clicking "Invite"', async () => {
    mockCreateInviteToken.mockResolvedValue('INVITE_TOKEN_XYZ_123');

    render(<AccountsView locale="en" />);

    const inviteBtn = screen.getByRole('button', { name: /invite/i });
    await act(async () => {
      fireEvent.click(inviteBtn);
    });

    expect(mockCreateInviteToken).toHaveBeenCalledWith('acc-family');

    // Verify token code displays
    expect(await screen.findByText('INVITE_TOKEN_XYZ_123')).toBeTruthy();

    // Verify QR Code (SVG element) is present in the DOM
    const qrSvg = document.querySelector('svg');
    expect(qrSvg).toBeTruthy();

    // Verify invite URL is rendered
    expect(screen.getByText(/join\?code=INVITE_TOKEN_XYZ_123/)).toBeTruthy();
  });

  // 6. Test error banner rendering: assert errorMsg state renders styled rose alert banner when set
  it('renders styled rose alert banner when errorMsg state is populated', async () => {
    mockCreateAccount.mockRejectedValue(new Error('Failed to create account due to network error'));

    render(<AccountsView locale="en" />);

    // Open creation modal and attempt submission
    fireEvent.click(screen.getByRole('button', { name: /new account/i }));
    fireEvent.click(screen.getByRole('button', { name: /family/i }));
    fireEvent.change(screen.getByPlaceholderText(/account name/i), { target: { value: 'Broken Account' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    });

    // Assert error message exists in DOM
    const errorBanner = screen.getByText('Failed to create account due to network error');
    expect(errorBanner).toBeTruthy();

    // Assert styled rose alert banner CSS classes
    expect(errorBanner.className).toContain('border-rose-500/30');
    expect(errorBanner.className).toContain('bg-rose-500/10');
    expect(errorBanner.className).toContain('text-rose-400');
  });

  it('renders unauthenticated error message when unauthenticated user submits new account', async () => {
    mockIsAuthenticated = false;

    render(<AccountsView locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: /new account/i }));
    fireEvent.click(screen.getByRole('button', { name: /family/i }));
    fireEvent.change(screen.getByPlaceholderText(/account name/i), { target: { value: 'Unauthenticated Acc' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
    });

    const errorBanner = screen.getByText(/กรุณาเข้าสู่ระบบก่อนสร้างบัญชีร่วม/i);
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.className).toContain('border-rose-500/30');
  });

  it('opens confirmation modal and deletes account when confirmed', async () => {
    render(<AccountsView locale="en" />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toBeTruthy();
    expect(within(modalDialog).getByText(/This permanently deletes "Our Family"/i)).toBeTruthy();

    const confirmDeleteBtn = within(modalDialog).getByRole('button', { name: /^delete$/i });
    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    expect(mockDeleteAccount).toHaveBeenCalledWith('acc-family');
  });

  it('calls leaveAccount when a member clicks Leave', () => {
    render(<AccountsView locale="en" />);

    const leaveBtn = screen.getByRole('button', { name: /leave/i });
    fireEvent.click(leaveBtn);

    expect(mockLeaveAccount).toHaveBeenCalledWith('acc-biz');
  });
});

