// components/sms/sms-confirm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmsConfirm } from './sms-confirm';
import type { TransactionCandidate } from '@/lib/sms-parser/types';

const CANDIDATES: TransactionCandidate[] = [
  {
    amount: 200,
    currency: 'THB',
    merchant: 'Tesco',
    date: '2026-07-23',
    type: 'expense',
    confidence: 0.9,
    rawText: 'KBANK 200 baht at Tesco',
    source: 'share-target',
  },
  {
    amount: 1500,
    currency: 'THB',
    merchant: 'Salary Co',
    date: '2026-07-23',
    type: 'income',
    confidence: 0.85,
    rawText: 'SCB 1500 received',
    source: 'share-target',
  },
];

function renderConfirm(props: Partial<React.ComponentProps<typeof SmsConfirm>> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onDismiss = vi.fn();
  const utils = render(
    <SmsConfirm
      text="KBANK 200 baht at Tesco"
      candidates={CANDIDATES}
      onSave={onSave}
      onDismiss={onDismiss}
      locale="en"
      {...props}
    />,
  );
  return { onSave, onDismiss, ...utils };
}

describe('SmsConfirm', () => {
  it('renders one row per candidate with amount and merchant', () => {
    renderConfirm();
    expect(screen.getByText('Tesco')).toBeInTheDocument();
    expect(screen.getByText('Salary Co')).toBeInTheDocument();
    // Confidence pills render (each candidate shows a rounded % value)
    expect(screen.getAllByTestId('sms-row')).toHaveLength(2);
  });

  it('filters candidates below the confidence threshold (default 0.7)', () => {
    const low: TransactionCandidate[] = [
      { ...CANDIDATES[0], confidence: 0.4, merchant: 'LowConf' },
    ];
    renderConfirm({ candidates: low });
    expect(screen.queryByText('LowConf')).toBeNull();
    expect(screen.getByText(/no reliable transactions/i)).toBeInTheDocument();
  });

  it('saves each expense/income candidate on "Add all" with correct shape', async () => {
    const { onSave } = renderConfirm();
    fireEvent.click(screen.getByTestId('sms-add-all-btn'));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0] as TransactionCandidate[];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toMatchObject({ amount: 200, merchant: 'Tesco', type: 'expense' });
    expect(saved[1]).toMatchObject({ amount: 1500, merchant: 'Salary Co', type: 'income' });
  });

  it('allows dismissing without saving', () => {
    const { onDismiss } = renderConfirm();
    fireEvent.click(screen.getByTestId('sms-dismiss-btn'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when there are no candidates', () => {
    renderConfirm({ candidates: [], text: 'not a bank sms' });
    expect(screen.getByText(/no reliable transactions/i)).toBeInTheDocument();
  });
});
