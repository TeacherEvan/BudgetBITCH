import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { useReceiptScan } from './use-receipt-scan';

// Mock the local expense store + id generator so the confirm path can be asserted.
const mockAddExpense = vi.fn().mockResolvedValue(undefined);
const mockSaveOfflineDraft = vi.fn().mockResolvedValue(undefined);
const mockGetOfflineDraft = vi.fn().mockResolvedValue(undefined);
const mockGetAllOfflineDrafts = vi.fn().mockResolvedValue([]);
const mockUpdateOfflineDraft = vi.fn().mockResolvedValue(undefined);
const mockDeleteOfflineDraft = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/db/stores/expenses-store', () => ({
  addExpense: (...args: unknown[]) => mockAddExpense(...args),
}));
vi.mock('@/lib/db/stores/receipt-drafts-store', () => ({
  saveOfflineDraft: (...args: unknown[]) => mockSaveOfflineDraft(...args),
  getOfflineDraft: (...args: unknown[]) => mockGetOfflineDraft(...args),
  getAllOfflineDrafts: (...args: unknown[]) => mockGetAllOfflineDrafts(...args),
  updateOfflineDraft: (...args: unknown[]) => mockUpdateOfflineDraft(...args),
  deleteOfflineDraft: (...args: unknown[]) => mockDeleteOfflineDraft(...args),
}));
vi.mock('@/lib/db/local-db', () => ({
  generateId: () => 'expense-1',
}));

// Mock Convex useMutation. The scrape call passes { payload } and should return
// a draft; answer/confirm pass ids and return {}. We branch on the arg shape.
const mockMutation = vi.fn().mockImplementation(async (args: unknown) => {
  if (args && typeof args === 'object' && 'clientDraftId' in (args as Record<string, unknown>)) {
    return { receiptId: 'receipt-1', alreadySynced: false };
  }
  if (args && typeof args === 'object' && 'payload' in (args as Record<string, unknown>)) {
    return {
      draftId: 'draft-123',
      fields: {
        total: { value: 150.0, conf: 0.9 },
        merchant: { value: 'CHECKERS', conf: 0.9 },
        category: { value: 'groceries', conf: 0.8 },
        date: { value: '2026-03-15', conf: 0.9 },
      },
      confidence: { total: 0.9, merchant: 0.9, category: 0.8, date: 0.9 },
      questions: [],
      lineItems: [
        { description: 'Milk 2L', amount: 29.99 },
        { description: 'Netflix subscription', amount: 199.0 },
        { description: 'Bread', amount: 15.5 },
      ],
    };
  }
  return {};
});

vi.mock('convex/react', () => ({
  useMutation: () => mockMutation,
}));

// Capture scanImage's OCR + preprocess deps so we don't need real canvas workers.
vi.mock('../lib/receipt/preprocess', () => ({
  preprocessImage: vi.fn().mockResolvedValue({ canvas: {} as HTMLCanvasElement }),
}));
vi.mock('../lib/receipt/ocr-worker', () => ({
  runOcrScan: vi.fn().mockResolvedValue({
    lines: [{ text: 'CHECKERS', conf: 90, y: 10, words: [] }],
    width: 100,
    height: 100,
    lang: 'eng',
    engine: 'tesseract.js@6',
    capturedAt: Date.now(),
  }),
  resetOcrWorker: vi.fn().mockResolvedValue(undefined),
}));

describe('useReceiptScan hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initializes with idle state and exposes scan function', () => {
    const { result } = renderHook(() => useReceiptScan());

    expect(result.current.isScanning).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.draft).toBeNull();
    expect(typeof result.current.scanImage).toBe('function');
  });

  test('confirmDraft writes a categorized local expense and clears the draft', async () => {
    const { result } = renderHook(() => useReceiptScan());

    // Simulate a completed scan producing a draft.
    await act(async () => {
      await result.current.scanImage({} as HTMLImageElement, 'ZA');
    });

    expect(result.current.draft).not.toBeNull();

    // Confirm the draft → should create a local expense and clear the draft.
    await act(async () => {
      await result.current.confirmDraft();
    });

    expect(mockAddExpense).toHaveBeenCalledTimes(1);
    const entry = mockAddExpense.mock.calls[0][0];
    expect(entry.amount).toBe(150);
    expect(entry.merchant).toBe('CHECKERS');
    expect(entry.category).toBe('food'); // inferred from merchant, NOT the invalid 'groceries'
    expect(entry.source).toBe('receipt');
    expect(entry.date).toBe('2026-03-15');
    expect(result.current.draft).toBeNull();
  });

  test('confirmDraft persists itemized line items mapped to ExpenseCategory', async () => {
    const { result } = renderHook(() => useReceiptScan());

    await act(async () => {
      await result.current.scanImage({} as HTMLImageElement, 'ZA');
    });
    expect(result.current.draft?.lineItems).toHaveLength(3);

    await act(async () => {
      await result.current.confirmDraft();
    });

    const entry = mockAddExpense.mock.calls[0][0];
    expect(entry.lineItems).toEqual([
      { description: 'Milk 2L', amount: 29.99, category: 'food' },
      { description: 'Netflix subscription', amount: 199.0, category: 'subscriptions' },
      { description: 'Bread', amount: 15.5, category: 'food' },
    ]);
  });

  test('confirmDraft with skipLocalAdd confirms on server but writes no local expense', async () => {
    const { result } = renderHook(() => useReceiptScan());

    await act(async () => {
      await result.current.scanImage({} as HTMLImageElement, 'ZA');
    });
    expect(result.current.draft).not.toBeNull();

    // Caller (Quick Add) already persisted the expense, so pass skipLocalAdd
    // to avoid a duplicate write into the local expense store.
    await act(async () => {
      await result.current.confirmDraft({ merchant: 'CHECKERS' }, { skipLocalAdd: true });
    });

    // No local expense written, but the draft still cleared and the server
    // confirm mutation was invoked with the overrides.
    expect(mockAddExpense).not.toHaveBeenCalled();
    expect(result.current.draft).toBeNull();
    const entry = mockMutation.mock.calls[mockMutation.mock.calls.length - 1][0];
    expect(entry).toMatchObject({ overrides: { merchant: 'CHECKERS' } });
  });

  test('replays locally queued drafts after reconnecting and removes synced drafts', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useReceiptScan());

    await act(async () => {
      await result.current.scanImage({} as HTMLImageElement, 'ZA');
    });

    expect(mockSaveOfflineDraft).toHaveBeenCalledWith(expect.objectContaining({
      clientDraftId: expect.any(String),
      payload: expect.any(Object),
    }));

    const queuedDraft = mockSaveOfflineDraft.mock.calls[0][0];
    mockGetAllOfflineDrafts.mockResolvedValue([queuedDraft]);
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(mockDeleteOfflineDraft).toHaveBeenCalledWith(queuedDraft.clientDraftId);
    });
    expect(mockMutation).toHaveBeenCalledWith(expect.objectContaining({
      clientDraftId: queuedDraft.clientDraftId,
      payload: queuedDraft.payload,
    }));
  });

  test('keeps a queued draft when server synchronization fails', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { result } = renderHook(() => useReceiptScan());

    await act(async () => {
      await result.current.scanImage({} as HTMLImageElement, 'ZA');
    });

    const queuedDraft = mockSaveOfflineDraft.mock.calls[0][0];
    mockGetAllOfflineDrafts.mockResolvedValue([queuedDraft]);
    mockMutation.mockRejectedValueOnce(new Error('network unavailable'));
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(mockMutation).toHaveBeenCalled());
    expect(mockDeleteOfflineDraft).not.toHaveBeenCalledWith(queuedDraft.clientDraftId);
  });
});
