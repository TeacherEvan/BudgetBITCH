import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useReceiptScan } from './use-receipt-scan';

// Mock Convex useMutation
vi.mock('convex/react', () => ({
  useMutation: vi.fn().mockReturnValue(async () => ({
    draftId: 'draft-123',
    fields: {
      total: { value: 150.0, conf: 0.9 },
      merchant: { value: 'CHECKERS', conf: 0.9 },
      category: { value: 'groceries', conf: 0.8 },
      date: { value: '2026-03-15', conf: 0.9 },
    },
    confidence: { total: 0.9, merchant: 0.9, category: 0.8, date: 0.9 },
    questions: [],
  })),
}));

describe('useReceiptScan hook', () => {
  test('initializes with idle state and exposes scan function', () => {
    const { result } = renderHook(() => useReceiptScan());

    expect(result.current.isScanning).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.draft).toBeNull();
    expect(typeof result.current.scanImage).toBe('function');
  });
});
