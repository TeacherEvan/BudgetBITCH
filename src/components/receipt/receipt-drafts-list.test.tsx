import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Capture the mutation callbacks so tests can drive confirm/delete.
const hoisted = vi.hoisted(() => ({
  confirmFn: vi.fn(async () => ({ success: true })),
  deleteFn: vi.fn(async () => ({ success: true })),
  addExpense: vi.fn(async () => {}),
  generateId: () => 'test-expense-id',
  queryResult: undefined as unknown,
  mutationCallCount: 0,
}));

vi.mock('convex/react', () => ({
  useQuery: () => hoisted.queryResult,
  useMutation: () => {
    // Called in order: confirm (first), then deleteReceipt (second).
    if (hoisted.mutationCallCount === 0) {
      hoisted.mutationCallCount += 1;
      return hoisted.confirmFn;
    }
    return hoisted.deleteFn;
  },
}));

vi.mock('@/lib/db/stores/expenses-store', () => ({
  addExpense: hoisted.addExpense,
}));

vi.mock('@/lib/db/local-db', () => ({
  generateId: hoisted.generateId,
}));

import { ReceiptDraftsList } from './receipt-drafts-list';

const { confirmFn, deleteFn, addExpense } = hoisted;

const draft = {
  _id: 'receipt-1',
  _creationTime: 1_700_000_000_000,
  userId: 'u1',
  amount: 30,
  merchant: 'LINE Shop',
  category: 'food',
  date: '2026-07-21',
  source: 'line',
  status: 'draft',
  engine: 'scraper-bot',
  geminiModel: 'scraper-bot',
  imageMimeType: 'application/json',
  imageSizeBytes: 0,
  parsedAt: 1_700_000_000_000,
};

beforeEach(() => {
  hoisted.confirmFn.mockClear();
  hoisted.deleteFn.mockClear();
  hoisted.addExpense.mockClear();
  hoisted.queryResult = undefined;
  hoisted.mutationCallCount = 0;
});

describe('ReceiptDraftsList', () => {
  it('renders nothing when there are no bot drafts', () => {
    hoisted.queryResult = { receipts: [], nextCursor: null };
    const { container } = render(<ReceiptDraftsList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('populates editable fields from a bot draft and saves as one expense', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    // Editable fields are pre-filled from the draft.
    const amountInput = screen.getByDisplayValue('30') as HTMLInputElement;
    expect(amountInput).toBeInTheDocument();
    expect(screen.getByDisplayValue('LINE Shop')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      // Expense written locally exactly once.
      expect(addExpense).toHaveBeenCalledTimes(1);
      expect(addExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-expense-id',
          amount: 30,
          merchant: 'LINE Shop',
          category: 'food',
          source: 'receipt',
        })
      );
      // Server draft confirmed once (no duplicate write).
      expect(confirmFn).toHaveBeenCalledTimes(1);
      expect(confirmFn).toHaveBeenCalledWith({
        draftId: 'receipt-1',
        overrides: expect.objectContaining({ amount: 30, merchant: 'LINE Shop', category: 'food' }),
      });
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });

  it('saves the user-edited values, not the original draft values', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    const amountInput = screen.getByDisplayValue('30') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '12.50' } });

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      expect(addExpense).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 12.5, merchant: 'LINE Shop' })
      );
    });
  });

  it('discard deletes the server draft and never writes an expense', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    fireEvent.click(screen.getByText('Discard'));

    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledTimes(1);
      expect(deleteFn).toHaveBeenCalledWith({ receiptId: 'receipt-1' });
      expect(addExpense).not.toHaveBeenCalled();
      expect(confirmFn).not.toHaveBeenCalled();
    });
  });
});
