// hooks/use-quick-add-state.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuickAddState } from './use-quick-add-state';

// ---- Mock the same surface the page relies on (mirrors page.test.tsx) ----

let mockExpenses: Array<{ id: string; merchant: string }> = [];
const mockAddExpense = vi.fn();
const mockAddIncome = vi.fn();
const mockSaveProfile = vi.fn();
const mockProfile = { completed: true, answers: { income: 50000, rent: 10000 } };

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({ add: mockAddExpense, expenses: mockExpenses }),
  useIncomes: () => ({ add: mockAddIncome }),
  useWizardProfile: () => ({ profile: mockProfile, save: mockSaveProfile }),
}));

const mockRepeatExpense = vi.fn();
vi.mock('@/lib/db/stores/expenses-store', () => ({
  repeatExpense: (...args: unknown[]) => mockRepeatExpense(...args),
}));

// parse-entry findRepeatCandidate uses existingExpenses (merchant) — stub it
const mockFindRepeat = vi.fn();
vi.mock('@/lib/quick-add/parse-entry', () => ({
  parseManualEntry: (s: string) => {
    const n = Number(s.replace(/[^0-9.]/g, '')) || 0;
    const note = s.replace(/[0-9.,]/g, '').trim() || undefined;
    return { amount: n, note };
  },
  findRepeatCandidate: (...args: unknown[]) => mockFindRepeat(...args),
}));

vi.mock('@/lib/receipt/map-category', () => ({
  mapCategory: (s: string) => s?.toLowerCase?.() ?? 'other',
  reconcileLineItems: (items: unknown[], _total: number) => items,
}));

const parseSMSMock = vi.fn(() => ({ candidates: [], rawText: '', detectedCountry: null }));
const getBestCandidateMock = vi.fn(() => null);
vi.mock('@/lib/sms-parser', () =>
  ({
    parseSMS: (...args: unknown[]) => parseSMSMock(...(args as [])),
    getBestCandidate: (...args: unknown[]) => getBestCandidateMock(...(args as [])),
  }) as unknown as typeof import('@/lib/sms-parser'),
);

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
let mockDraft: { fields: Record<string, { value: unknown }>; questions?: unknown[]; lineItems?: unknown[] } | null = null;
const mockScanImage = vi.fn();
const mockConfirmDraft = vi.fn();
vi.mock('@/hooks/use-receipt-scan', () => ({
  useReceiptScan: () => ({
    draft: mockDraft,
    scanImage: mockScanImage,
    answerQuestion: vi.fn(),
    confirmDraft: mockConfirmDraft,
  }),
}));

const mockGrant = vi.fn();
const mockDeny = vi.fn();
vi.mock('@/hooks/use-inbox-permission', () => ({
  useInboxPermission: () => ({ status: 'default', grantPermission: mockGrant, denyPermission: mockDeny }),
}));

vi.mock('convex/react', () => ({
  useAction: () => vi.fn(),
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

describe('useQuickAddState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDraft = null;
    mockExpenses = [];
    mockFindRepeat.mockReset();
    parseSMSMock.mockReturnValue({ candidates: [], rawText: '', detectedCountry: null });
    getBestCandidateMock.mockReturnValue(null);
  });

  it('initializes with expense mode + manual entry source', () => {
    const { result } = renderHook(() => useQuickAddState());
    expect(result.current.isExpense).toBe(true);
    expect(result.current.entrySource).toBe('manual');
    expect(result.current.scannedAmount).toBe('');
    expect(result.current.inputText).toBe('');
  });

  it('toggles between expense and income', () => {
    const { result } = renderHook(() => useQuickAddState());
    act(() => result.current.setIsExpense(false));
    expect(result.current.isExpense).toBe(false);
    act(() => result.current.setIsExpense(true));
    expect(result.current.isExpense).toBe(true);
  });

  it('records an income and bumps the wizard profile monthly income', async () => {
    const { result } = renderHook(() => useQuickAddState());
    act(() => {
      result.current.setIsExpense(false);
      result.current.setInputText('2500 bonus');
    });
    await act(async () => {
      await result.current.handleSave();
    });
    await waitFor(() => {
      expect(mockAddIncome).toHaveBeenCalledTimes(1);
      expect(mockSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ answers: expect.objectContaining({ income: 52500 }) }),
      );
    });
  });

  it('saves a note-only expense as amount 0 (never blocks the user from recording a spend)', async () => {
    const { result } = renderHook(() => useQuickAddState());
    act(() => result.current.setInputText('lunch with team'));
    await act(async () => {
      await result.current.handleSave();
    });
    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({ amount: 0 }));
    });
  });

  it('populates scanned review fields from a draft but does NOT auto-commit', async () => {
    mockDraft = {
      fields: { total: { value: 450 }, merchant: { value: 'Supermarket' }, category: { value: 'food' } },
      questions: [],
    };
    const { result } = renderHook(() => useQuickAddState());
    await waitFor(() => {
      expect(result.current.scannedAmount).toBe('450');
      expect(result.current.scannedMerchant).toBe('Supermarket');
    });
    expect(mockAddExpense).not.toHaveBeenCalled();
  });

  it('offers a repeat candidate and repeats on tap (independent of save)', async () => {
    mockExpenses = [{ id: 'exp-prev-1', merchant: 'Supermarket' }];
    mockFindRepeat.mockImplementation((_exp: unknown[], merchant: string) =>
      merchant.toLowerCase() === 'supermarket' ? { id: 'exp-prev-1', merchant: 'Supermarket', amount: 400 } : undefined,
    );
    const { result } = renderHook(() => useQuickAddState());
    act(() => {
      result.current.setEntrySource('receipt');
      result.current.setScannedMerchant('supermarket');
    });
    expect(result.current.repeatCandidate).toEqual({ id: 'exp-prev-1', merchant: 'Supermarket', amount: 400 });
    await act(async () => {
      await result.current.handleRepeatPurchase();
    });
    await waitFor(() => {
      expect(mockRepeatExpense).toHaveBeenCalledWith('exp-prev-1');
    });
    expect(mockAddExpense).not.toHaveBeenCalled();
  });

  it('saves a scanned receipt: one expense write + draft confirm (no double write)', async () => {
    mockDraft = {
      fields: { total: { value: 450 }, merchant: { value: 'Supermarket' }, category: { value: 'food' } },
      questions: [],
    };
    const { result } = renderHook(() => useQuickAddState());
    await waitFor(() => expect(result.current.scannedAmount).toBe('450'));
    await act(async () => {
      await result.current.handleSaveScannedReceipt();
    });
    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({ amount: 450, merchant: 'Supermarket', source: 'receipt' }));
      expect(mockConfirmDraft).toHaveBeenCalledWith(undefined, { skipLocalAdd: true });
    });
  });

  it('scrapes SMS text and surfaces verified data, then confirms an import expense', async () => {
    // The AI parse path is mocked offline (navigator.onLine guard); exercise the
    // parseSMS fallback by re-mocking the candidate before the call.
    parseSMSMock.mockReturnValue({
      candidates: [
        { amount: 42.5, merchant: 'STARBUCKS', date: '2026-08-01', type: 'expense', rawText: 'STARBUCKS', confidence: 1 } as never,
      ],
      rawText: 'Spent $42.50 at STARBUCKS',
      detectedCountry: null,
    } as never);
    getBestCandidateMock.mockReturnValue({
      amount: 42.5,
      merchant: 'STARBUCKS',
      date: '2026-08-01',
      type: 'expense',
      rawText: 'STARBUCKS',
      confidence: 1,
    } as never);
    const { result } = renderHook(() => useQuickAddState());
    await act(async () => {
      await result.current.handleScrapeSms('Spent $42.50 at STARBUCKS');
    });
    await waitFor(() => {
      expect(result.current.verifiedSmsData).toMatchObject({ amount: 42.5, merchant: 'STARBUCKS', type: 'expense' });
    });
    await act(async () => {
      await result.current.handleConfirmVerifiedSms();
    });
    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({ amount: 42.5, source: 'import' }));
    });
  });

  it('rejects a non-image file in the camera handler', async () => {
    const { result } = renderHook(() => useQuickAddState());
    const fakeEvent = {
      target: { files: [{ type: 'text/plain', name: 'notes.txt' }], value: '' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      await result.current.handleFileChange(fakeEvent);
    });
    await waitFor(() => {
      expect(result.current.toast.message).toContain('valid image file');
    });
    expect(mockScanImage).not.toHaveBeenCalled();
  });
});
