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
    expenses: mockExpenses,
  }),
  useIncomes: () => ({
    add: mockAddIncome,
  }),
  useWizardProfile: () => ({
    profile: mockProfile,
    save: mockSaveProfile,
  }),
}));

// Mock the Repeat Purchase store action. The page matches a scanned merchant
// against existing expenses and offers a one-tap repeat of the last purchase.
const mockRepeatExpense = vi.fn();
vi.mock('@/lib/db/stores/expenses-store', () => ({
  repeatExpense: (...args: unknown[]) => mockRepeatExpense(...args),
}));

let mockExpenses: Array<{
  id: string;
  date: string;
  category: string;
  merchant: string;
  amount: number;
  source: string;
}> = [];

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
  // Quick Add migrated to next-intl; the test renders without a provider,
  // so return the en catalog strings directly for the 'QuickAdd' namespace.
  useTranslations: () => (key: string) => {
    const en = {
      title: 'Quick Add',
      placeholder: 'Type amount then note, e.g. 120 lunch',
      camera: 'Scan Receipt',
      inbox: 'Inbox SMS/Email',
      save: 'Save',
      scanning: 'Scanning & scraping receipt photo...',
      parsing: 'Parsing SMS message...',
      successAdded: 'Expense recorded successfully!',
      successIncome: 'Income added successfully!',
      failed: 'Failed to record entry!',
      invalidAmount: 'Please enter a valid amount',
      back: 'Back',
      expense: 'Expense (-)',
      income: 'Income (+)',
      permTitle: 'SMS & Email Inbox Permission',
      permDesc: 'Allow Budget Boss to parse financial transaction messages from your inbox or clipboard to auto-fill details?',
      rememberChoice: 'Remember my decision on this device',
      allow: 'Allow Access',
      deny: 'Deny Access',
      pasteSmsTitle: 'Paste SMS or Email Notification',
      pasteSmsPlaceholder: 'Paste bank alert e.g. "Paid $45.50 at STARBUCKS card 1234 on 08/01/2026"',
      extractBtn: 'Scrape & Auto-Fill',
      close: 'Close',
    } as Record<string, string>;
    return en[key] ?? key;
  },
}));

// Mock Convex
const mockProxyScan = vi.fn();
const mockConvexMutation = vi.fn();
vi.mock('convex/react', () => ({
  useAction: () => mockProxyScan,
  useMutation: () => mockConvexMutation,
  useQuery: () => undefined,
}));

// Mock the deterministic receipt scraper hook.
type MockDraft = {
  draftId: string;
  fields: Record<string, { value: unknown }>;
  questions: unknown[];
  lineItems?: Array<{ description: string; amount: number; qty?: number; unit_price?: number }>;
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
    mockExpenses = [];
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

  it('guards: manual expense entry is disabled — Save does NOT write from a typed note-only input (quick-add has no manual amount feature)', async () => {
    render(<QuickAddPage />);
    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Note-only entry (no number) must NOT save — there is no manual-amount feature.
    fireEvent.change(input, { target: { value: 'lunch with team' } });
    fireEvent.click(saveButton);

    // Button is disabled in expense + manual mode, so no write happens.
    await waitFor(() => {
      expect(mockAddExpense).not.toHaveBeenCalled();
    });
  });

  it('guards: typed amount + note does NOT save as a manual expense (no manual amount feature)', async () => {
    render(<QuickAddPage />);
    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '150.50 delicious dinner' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddExpense).not.toHaveBeenCalled();
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

  it('offers a Repeat Purchase "+" in the review card when a same-merchant expense exists', async () => {
    mockExpenses = [
      { id: 'exp-prev-1', date: '2026-07-28', category: 'food', merchant: 'Supermarket', amount: 400, source: 'receipt' },
    ];
    mockDraft = {
      draftId: 'draft-r1',
      fields: {
        total: { value: 450 },
        merchant: { value: 'supermarket' }, // case-insensitive match
        category: { value: 'food' },
      },
      questions: [],
    };

    render(<QuickAddPage />);

    const repeatBtn = await screen.findByTestId('repeat-purchase-btn');
    fireEvent.click(repeatBtn);

    await waitFor(() => {
      expect(mockRepeatExpense).toHaveBeenCalledWith('exp-prev-1');
    });
    // Repeat and Save are independent: the review card must still be open
    // and nothing was saved by the repeat tap itself.
    expect(screen.getByTestId('scanned-receipt-card')).toBeInTheDocument();
    expect(mockAddExpense).not.toHaveBeenCalled();
  });

  it('hides the Repeat Purchase button when no prior expense matches the merchant', async () => {
    mockExpenses = [
      { id: 'exp-other', date: '2026-07-28', category: 'food', merchant: 'Corner Cafe', amount: 60, source: 'manual' },
    ];
    mockDraft = {
      draftId: 'draft-r2',
      fields: {
        total: { value: 450 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
    };

    render(<QuickAddPage />);

    await waitFor(() => {
      expect(screen.getByTestId('scanned-receipt-card')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('repeat-purchase-btn')).not.toBeInTheDocument();
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

  it('carries camera-scanned line items into the saved expense with per-item categories', async () => {
    // Regression guard: the camera-scan effect previously ignored draft.lineItems
    // (only the LINE-bot path populated them) AND handleSaveScannedReceipt wrote
    // the expense without lineItems — so a scanned receipt's itemization never
    // reached the store and the whole total landed in one category.
    mockDraft = {
      draftId: 'draft-items',
      fields: {
        total: { value: 100 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
      lineItems: [
        { description: 'bread', amount: 25 },
        { description: 'milk', amount: 18.5 },
        { description: 'movie rental', amount: 56.5 },
      ],
    };

    render(<QuickAddPage />);
    fireEvent.click(await screen.findByTestId('save-scanned-receipt-btn'));

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
    });

    const entry = mockAddExpense.mock.calls[0][0];
    expect(entry.source).toBe('receipt');
    expect(entry.lineItems).toEqual([
      { description: 'bread', amount: 25, category: 'food' },
      { description: 'milk', amount: 18.5, category: 'food' },
      { description: 'movie rental', amount: 56.5, category: 'entertainment' },
    ]);
  });

  it('drops a line-item set that does not reconcile with the reviewed total', async () => {
    // Half-parsed receipt: OCR captured only 30 of a 450 total. Persisting those
    // items would misreport per-category spend, so they must be discarded and
    // the receipt saved as a single unsplit expense.
    mockDraft = {
      draftId: 'draft-mismatch',
      fields: {
        total: { value: 450 },
        merchant: { value: 'Supermarket' },
        category: { value: 'food' },
      },
      questions: [],
      lineItems: [{ description: 'bread', amount: 30 }],
    };

    render(<QuickAddPage />);
    fireEvent.click(await screen.findByTestId('save-scanned-receipt-btn'));

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
    });

    const entry = mockAddExpense.mock.calls[0][0];
    expect(entry.amount).toBe(450);
    expect(entry.lineItems).toBeUndefined();
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

  it('app camera path: HF bot scan populates editable fields and does NOT auto-commit (fix: AI-scan-no-autocommit)', async () => {
    // Regression guard: the camera path previously called addExpense directly
    // and returned early, bypassing the editable review card entirely. Now it
    // routes through the Convex proxy → HF bot and populates the scanned fields
    // for the user to review before pressing Save.
    mockProxyScan.mockResolvedValueOnce({
      success: true,
      draftId: 'd-app-1',
      fields: {
        total: { value: 250 },
        merchant: { value: 'AI Supermarket' },
        category: { value: 'food' },
        date: { value: '2026-08-03' },
        tax: { value: 17.5 },
      },
      lineItems: [
        { description: 'groceries', amount: 200 },
        { description: 'movie ticket', amount: 50 },
      ],
    });

    render(<QuickAddPage />);

    const file = new File(['fake-image'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('camera-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // The editable review card appears with the bot-scanned values
    await waitFor(() => {
      expect(screen.getByTestId('scanned-receipt-card')).toBeInTheDocument();
    });
    const amountInput = screen.getByTestId('scanned-amount-input') as HTMLInputElement;
    const merchantInput = screen.getByTestId('scanned-merchant-input') as HTMLInputElement;
    const taxInput = screen.getByTestId('scanned-tax-input') as HTMLInputElement;
    expect(amountInput.value).toBe('250');
    expect(merchantInput.value).toBe('AI Supermarket');
    expect(taxInput.value).toBe('17.5');

    // Line items render and are editable
    expect(screen.getByTestId('scanned-line-item-desc-0')).toBeInTheDocument();

    // No expense was auto-committed — user must press Save
    expect(mockAddExpense).not.toHaveBeenCalled();

    // Saving writes once with the bot-scanned values + line items
    fireEvent.click(screen.getByTestId('save-scanned-receipt-btn'));
    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      const entry = mockAddExpense.mock.calls[0][0];
      expect(entry.amount).toBe(250);
      expect(entry.merchant).toBe('AI Supermarket');
      expect(entry.source).toBe('receipt');
      expect(entry.tax).toBe(17.5);
      expect(entry.lineItems).toEqual([
        { description: 'groceries', amount: 200, category: 'food' },
        { description: 'movie ticket', amount: 50, category: 'entertainment' },
      ]);
    });
  });
});
