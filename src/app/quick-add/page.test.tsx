// app/quick-add/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickAddPage from './page';

// Mock DB Hooks
const mockAddExpense = vi.fn();
const mockAddIncome = vi.fn();
const mockSaveProfile = vi.fn();
const mockProfile = {
  completed: true,
  answers: {
    income: 50000,
    rent: 10000,
  }
};

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({
    add: mockAddExpense,
  }),
  useIncomes: () => ({
    add: mockAddIncome,
  }),
  useWizardProfile: () => ({
    profile: mockProfile,
    save: mockSaveProfile,
  }),
}));

// Mock Next Navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next Intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock Convex
const mockParseReceipt = vi.fn();
const mockConvexMutation = vi.fn();
vi.mock('convex/react', () => ({
  useAction: () => mockParseReceipt,
  useMutation: () => mockConvexMutation,
  useQuery: () => undefined,
}));

// Mock the deterministic receipt scraper hook.
type MockDraft = {
  draftId: string;
  fields: Record<string, { value: unknown }>;
  questions: unknown[];
} | null;

let mockDraft: MockDraft = null;
const mockScanImage = vi.fn();
const mockAnswerQuestion = vi.fn();
const mockConfirmDraft = vi.fn();

vi.mock('@/hooks/use-receipt-scan', () => ({
  useReceiptScan: () => ({
    isScanning: false,
    progress: 0,
    draft: mockDraft,
    error: null,
    scanImage: mockScanImage,
    answerQuestion: mockAnswerQuestion,
    confirmDraft: mockConfirmDraft,
  }),
}));

describe('QuickAddPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDraft = null;
  });

  it('renders quick add components correctly', () => {
    render(<QuickAddPage />);
    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan receipt/i })).toBeInTheDocument();
    expect(screen.getByTestId('inbox-sms-btn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('toggles between expense (-) and income (+)', () => {
    render(<QuickAddPage />);
    const toggleButton = screen.getByRole('button', { name: /expense \(-\)/i });
    expect(toggleButton).toBeInTheDocument();

    // Toggle to income
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /income \(\+\)/i })).toBeInTheDocument();

    // Toggle back to expense
    fireEvent.click(screen.getByRole('button', { name: /income \(\+\)/i }));
    expect(screen.getByRole('button', { name: /expense \(-\)/i })).toBeInTheDocument();
  });

  it('validates empty inputs on save', async () => {
    render(<QuickAddPage />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });
  });

  it('parses amount and note, then calls addExpense on save for expenses', async () => {
    render(<QuickAddPage />);
    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '150.50 delicious dinner' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 150.50,
        merchant: 'delicious dinner',
        source: 'manual',
      }));
      expect(screen.getByText('Expense recorded successfully!')).toBeInTheDocument();
    });
  });

  it('updates wizard profile income on save for income', async () => {
    render(<QuickAddPage />);
    const toggleButton = screen.getByRole('button', { name: /expense \(-\)/i });
    
    fireEvent.click(toggleButton);

    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '2500 bonus' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
      expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({
        answers: expect.objectContaining({
          income: 52500,
        }),
      }));
      expect(screen.getByText('Income added successfully!')).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back clicked', () => {
    render(<QuickAddPage />);
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows editable scanned-receipt fields but does NOT auto-commit (no data lands until Save)', async () => {
    mockDraft = {
      draftId: 'draft-1',
      fields: {
        total: { value: 450 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
    };

    render(<QuickAddPage />);

    // Review card + editable fields are populated from the draft...
    await waitFor(() => {
      expect(screen.getByTestId('scanned-receipt-card')).toBeInTheDocument();
    });
    const amountInput = screen.getByTestId('scanned-amount-input') as HTMLInputElement;
    const merchantInput = screen.getByTestId('scanned-merchant-input') as HTMLInputElement;
    expect(amountInput.value).toBe('450');
    expect(merchantInput.value).toBe('Supermarket');
    // ...but no expense was written yet. The previous bug auto-committed
    // silently, so this asserts the fix: scanned data sits in fields first.
    expect(mockAddExpense).not.toHaveBeenCalled();
  });

  it('saves the scanned receipt via the review card: one expense write + draft confirm (no double write)', async () => {
    mockDraft = {
      draftId: 'draft-1',
      fields: {
        total: { value: 450 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
    };

    render(<QuickAddPage />);

    const saveBtn = await screen.findByTestId('save-scanned-receipt-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 450,
        merchant: 'Supermarket',
        category: 'food',
        source: 'receipt',
      }));
      // Confirm the draft with skipLocalAdd so the expense isn't written twice.
      expect(mockConfirmDraft).toHaveBeenCalledWith(undefined, { skipLocalAdd: true });
    });
  });

  it('persists user-edited field values when saving the scanned receipt', async () => {
    mockDraft = {
      draftId: 'draft-2',
      fields: {
        total: { value: 450 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
    };

    render(<QuickAddPage />);

    const amountInput = (await screen.findByTestId('scanned-amount-input')) as HTMLInputElement;
    const merchantInput = (await screen.findByTestId('scanned-merchant-input')) as HTMLInputElement;

    // User corrects the amount and merchant before saving.
    fireEvent.change(amountInput, { target: { value: '39.99' } });
    fireEvent.change(merchantInput, { target: { value: 'Corner Shop' } });

    fireEvent.click(screen.getByTestId('save-scanned-receipt-btn'));

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 39.99,
        merchant: 'Corner Shop',
        source: 'receipt',
      }));
    });
  });

  it('handles Inbox SMS permission prompt with remember tick box and scrapes message', async () => {
    render(<QuickAddPage />);
    const inboxBtn = screen.getByTestId('inbox-sms-btn');
    
    // Click Inbox SMS button triggers permission modal
    fireEvent.click(inboxBtn);
    expect(screen.getByTestId('inbox-perm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('remember-perm-checkbox')).toBeChecked();

    // Grant permission
    fireEvent.click(screen.getByTestId('grant-perm-btn'));

    // Opens SMS Paste Modal
    await waitFor(() => {
      expect(screen.getByTestId('paste-sms-modal')).toBeInTheDocument();
    });

    const smsInput = screen.getByTestId('sms-text-input');
    fireEvent.change(smsInput, { target: { value: 'Spent $42.50 at STARBUCKS card 9999 on 08/01/2026' } });
    fireEvent.click(screen.getByTestId('scrape-sms-btn'));

    // Input auto-fills with scraped details
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch') as HTMLInputElement;
      expect(input.value).toContain('42.5 STARBUCKS');
    });

    // Save expense and verify source is 'import' (SMS)
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 42.5,
        source: 'import',
      }));
    });
  });

  it('scrapes preset sample bank notification and shows verified card preview', async () => {
    render(<QuickAddPage />);

    const inboxBtn = screen.getByTestId('inbox-sms-btn');
    fireEvent.click(inboxBtn);

    // Grant permission
    fireEvent.click(screen.getByTestId('grant-perm-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('paste-sms-modal')).toBeInTheDocument();
    });

    // Click sample notification chip
    const presetBtn = screen.getByText(/CHASE: Your card ending in 1234 was charged \$45\.20 at TARGET on 08\/01/i);
    fireEvent.click(presetBtn);

    // Shows verified card preview
    await waitFor(() => {
      expect(screen.getByTestId('verified-scraped-card')).toBeInTheDocument();
      expect(screen.getByText('TARGET')).toBeInTheDocument();
      expect(screen.getByText('$45.20')).toBeInTheDocument();
    });

    // Confirm verified entry
    fireEvent.click(screen.getByTestId('confirm-verified-sms-btn'));

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 45.2,
        merchant: 'TARGET',
        source: 'import',
      }));
    });
  });

  it('rejects a non-image file and prompts for manual entry', async () => {
    render(<QuickAddPage />);

    const file = new File(['not-an-image'], 'notes.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('camera-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Please select a valid image file.')).toBeInTheDocument();
    });
    expect(mockScanImage).not.toHaveBeenCalled();
  });
});
