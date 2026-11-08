import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Capture the callbacks so tests can drive confirm/delete, audio, and haptics.
const refs = vi.hoisted(() => ({
  confirm: { __fn: 'confirm' },
  deleteReceipt: { __fn: 'deleteReceipt' },
  listReceipts: { __fn: 'listReceipts' },
}));

const hoisted = vi.hoisted(() => ({
  confirmFn: vi.fn(async () => ({ success: true })),
  deleteFn: vi.fn(async () => ({ success: true })),
  addExpense: vi.fn(async () => {}),
  addExpensesBulk: vi.fn(async () => {}),
  generateId: () => 'test-expense-id',
  queryResult: undefined as unknown,
  hapticTrigger: vi.fn(),
  playPaperTearSound: vi.fn(),
  playSuccessChime: vi.fn(),
}));

vi.mock('../../../convex/_generated/api', () => ({
  api: {
    receipts: {
      confirm: refs.confirm,
      deleteReceipt: refs.deleteReceipt,
      listReceipts: refs.listReceipts,
    },
  },
}));

vi.mock('convex/react', () => ({
  useQuery: () => hoisted.queryResult,
  useMutation: (mutation: unknown) => {
    if (mutation === refs.deleteReceipt) {
      return hoisted.deleteFn;
    }
    return hoisted.confirmFn;
  },
}));

vi.mock('@/hooks/use-haptic', () => ({
  useHaptic: () => ({
    trigger: hoisted.hapticTrigger,
  }),
}));

vi.mock('@/lib/audio/sound-fx', () => ({
  playPaperTearSound: hoisted.playPaperTearSound,
  playSuccessChime: hoisted.playSuccessChime,
}));

vi.mock('@/lib/db/stores/expenses-store', () => ({
  addExpense: hoisted.addExpense,
  addExpensesBulk: hoisted.addExpensesBulk,
}));

vi.mock('@/lib/db/local-db', () => ({
  generateId: hoisted.generateId,
}));

import { ReceiptDraftsList } from './receipt-drafts-list';

const {
  confirmFn,
  deleteFn,
  addExpense,
  addExpensesBulk,
  hapticTrigger,
  playPaperTearSound,
  playSuccessChime,
} = hoisted;

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
  items: [
    { title: 'Pad Thai', type: 'food', amount: 20 },
    { title: 'Iced Tea', type: 'food', amount: 10 },
  ],
};

beforeEach(() => {
  hoisted.confirmFn.mockClear();
  hoisted.deleteFn.mockClear();
  hoisted.addExpense.mockClear();
  hoisted.addExpensesBulk.mockClear();
  hoisted.hapticTrigger.mockClear();
  hoisted.playPaperTearSound.mockClear();
  hoisted.playSuccessChime.mockClear();
  hoisted.queryResult = undefined;
});

describe('ReceiptDraftsList', () => {
  it('renders nothing when there are no bot drafts', () => {
    hoisted.queryResult = { receipts: [], nextCursor: null };
    const { container } = render(<ReceiptDraftsList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders bot drafts list and shows reconciliation badge', () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    expect(screen.getByText('Receipts to review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('LINE Shop')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pad Thai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Iced Tea')).toBeInTheDocument();

    // Check reconciliation badge: 20 + 10 = 30, matches total
    expect(screen.getByTestId('line-items-reconciliation-badge-receipt-1')).toHaveTextContent(
      'Reconciled (30.00)'
    );
  });

  it('allows field editing overrides (amount, merchant, category, date)', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    const merchantInput = screen.getByLabelText('Merchant') as HTMLInputElement;
    const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;

    fireEvent.change(amountInput, { target: { value: '45.00' } });
    fireEvent.change(merchantInput, { target: { value: 'Night Market Stall' } });
    fireEvent.change(categorySelect, { target: { value: 'entertainment' } });
    fireEvent.change(dateInput, { target: { value: '2026-08-01' } });

    // Since items are present (20 + 10 = 30), now items sum 30 != amount 45 -> displays discrepancy badge
    expect(screen.getByTestId('line-items-reconciliation-badge-receipt-1')).toHaveTextContent(
      'Items 30.00 / 45.00'
    );

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      expect(confirmFn).toHaveBeenCalledWith({
        draftId: 'receipt-1',
        overrides: expect.objectContaining({
          amount: 45,
          merchant: 'Night Market Stall',
          category: 'entertainment',
          date: '2026-08-01',
        }),
      });
    });
  });

  it('supports adding and deleting line items with tactile feedback', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    // Initially 2 items
    expect(screen.getByDisplayValue('Pad Thai')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Iced Tea')).toBeInTheDocument();

    // Click "Add line item"
    const addBtn = screen.getByTestId('add-item-btn-receipt-1');
    fireEvent.click(addBtn);

    expect(hapticTrigger).toHaveBeenCalledWith('light');
    expect(playPaperTearSound).toHaveBeenCalledTimes(1);

    // An item 3 is added
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    const item3Title = screen.getByLabelText('Item 3 title');
    fireEvent.change(item3Title, { target: { value: 'Mango Sticky Rice' } });
    const item3Amount = screen.getByLabelText('Item 3 amount');
    fireEvent.change(item3Amount, { target: { value: '15' } });

    // Delete item 1 (Pad Thai)
    const removeBtn = screen.getByTestId('remove-item-btn-receipt-1-0');
    fireEvent.click(removeBtn);

    expect(hapticTrigger).toHaveBeenCalledWith('heavy');
    expect(playPaperTearSound).toHaveBeenCalledTimes(2);

    expect(screen.queryByDisplayValue('Pad Thai')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Mango Sticky Rice')).toBeInTheDocument();
  });

  it('triggers haptic success and chime on handleSave with bulk expense creation', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      expect(confirmFn).toHaveBeenCalledTimes(1);
      expect(addExpensesBulk).toHaveBeenCalledWith([
        expect.objectContaining({
          amount: 20,
          merchant: 'Pad Thai',
          category: 'food',
        }),
        expect.objectContaining({
          amount: 10,
          merchant: 'Iced Tea',
          category: 'food',
        }),
      ]);
      expect(hapticTrigger).toHaveBeenCalledWith('success');
      expect(playSuccessChime).toHaveBeenCalledTimes(1);
    });
  });

  it('saves single expense fallback when receipt has no line items', async () => {
    const singleDraft = { ...draft, items: undefined, lineItems: undefined };
    hoisted.queryResult = { receipts: [singleDraft], nextCursor: null };
    render(<ReceiptDraftsList />);

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      expect(addExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30,
          merchant: 'LINE Shop',
          category: 'food',
        })
      );
      expect(confirmFn).toHaveBeenCalledTimes(1);
      expect(hapticTrigger).toHaveBeenCalledWith('success');
      expect(playSuccessChime).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers haptic warning on handleDiscard and deletes server draft', async () => {
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    fireEvent.click(screen.getByText('Discard'));

    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledTimes(1);
      expect(deleteFn).toHaveBeenCalledWith({ receiptId: 'receipt-1' });
      expect(hapticTrigger).toHaveBeenCalledWith('warning');
      expect(addExpense).not.toHaveBeenCalled();
      expect(addExpensesBulk).not.toHaveBeenCalled();
    });
  });

  it('does not add expenses locally if server confirm fails', async () => {
    hoisted.confirmFn.mockRejectedValueOnce(new Error('Network error'));
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    fireEvent.click(screen.getByText('Save expense'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(confirmFn).toHaveBeenCalledTimes(1);
    expect(addExpense).not.toHaveBeenCalled();
    expect(addExpensesBulk).not.toHaveBeenCalled();
    expect(playSuccessChime).not.toHaveBeenCalled();
  });

  it('blocks synchronous double-clicks via inFlightIdsRef', async () => {
    let resolveConfirm: (value: { success: boolean }) => void;
    hoisted.confirmFn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        })
    );
    hoisted.queryResult = { receipts: [draft], nextCursor: null };
    render(<ReceiptDraftsList />);

    const saveButton = screen.getByText('Save expense');
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(confirmFn).toHaveBeenCalledTimes(1);

    resolveConfirm!({ success: true });

    await waitFor(() => {
      expect(addExpensesBulk).toHaveBeenCalledTimes(1);
    });
  });
});

