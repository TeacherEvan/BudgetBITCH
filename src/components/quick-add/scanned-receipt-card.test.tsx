// components/quick-add/scanned-receipt-card.test.tsx
import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScannedReceiptCard } from './scanned-receipt-card';
import type { ExpenseCategory, ReceiptLineItem } from '@/lib/types/budget';

// Plain DOM stand-ins keep the key-driven mount/unmount behaviour (the subject
// of these tests) while avoiding framer-motion's layout observers in jsdom.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      layout: _layout,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      onDragEnd: _onDragEnd,
      ...rest
    }: HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

vi.mock('@/hooks/use-haptic', () => ({
  useHaptic: () => ({ trigger: vi.fn() }),
}));

vi.mock('@/lib/audio/sound-fx', () => ({
  playPaperTearSound: vi.fn(),
}));

vi.mock('@/components/dashboard/currency-options', () => ({
  convertReceiptAmount: () => null,
}));

const NOOP = () => undefined;

function Harness() {
  const [items, setItems] = useState<ReceiptLineItem[]>([
    { description: '', amount: 0, category: 'food' as ExpenseCategory },
  ]);

  return (
    <ScannedReceiptCard
      loading={false}
      amount="12.50"
      merchant="Cafe"
      category="food"
      date="2026-11-23"
      tax="0"
      lineItems={items}
      repeatCandidate={undefined}
      onAmountChange={NOOP}
      onMerchantChange={NOOP}
      onCategoryChange={NOOP}
      onDateChange={NOOP}
      onTaxChange={NOOP}
      onUpdateLineItem={(idx, field, value) =>
        setItems((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
        )
      }
      onSave={NOOP}
      onRepeat={NOOP}
    />
  );
}

function typeInto(testId: string, text: string): void {
  let value = '';
  for (const ch of text) {
    value += ch;
    fireEvent.change(screen.getByTestId(testId), { target: { value } });
  }
}

describe('ScannedReceiptCard — editable line items', () => {
  it('guards regression: keeps focus on a line-item input while its description is edited', () => {
    render(<Harness />);
    const desc = screen.getByTestId('scanned-line-item-desc-0');
    desc.focus();
    expect(document.activeElement).toBe(desc);

    typeInto('scanned-line-item-desc-0', 'Latte');

    expect(screen.getByTestId('scanned-line-item-desc-0')).toHaveValue('Latte');
    expect(document.activeElement).toBe(screen.getByTestId('scanned-line-item-desc-0'));
  });

  it('guards regression: preserves a trailing decimal point and full cents while typing an amount character by character', () => {
    render(<Harness />);
    const amount = screen.getByTestId('scanned-line-item-amount-0');
    amount.focus();

    typeInto('scanned-line-item-amount-0', '12.50');

    expect(screen.getByTestId('scanned-line-item-amount-0')).toHaveValue('12.50');
    expect(document.activeElement).toBe(screen.getByTestId('scanned-line-item-amount-0'));
  });
});
