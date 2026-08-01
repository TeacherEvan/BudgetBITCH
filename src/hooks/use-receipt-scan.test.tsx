import { renderHook, act } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { useReceiptScan } from './use-receipt-scan';

// Mock the local expense store + id generator so the confirm path can be asserted.
const mockAddExpense = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/db/stores/expenses-store', () => ({
  addExpense: (...args: unknown[]) => mockAddExpense(...args),
}));
vi.mock('@/lib/db/local-db', () => ({
  generateId: () => 'expense-1',
}));

// Mock Convex useMutation. The scrape call passes { payload } and should return
// a draft; answer/confirm pass ids and return {}. We branch on the arg shape.
const mockMutation = vi.fn().mockImplementation(async (args: unknown) => {
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
});
