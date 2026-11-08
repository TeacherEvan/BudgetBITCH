import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ReceiptVerifySheet } from './receipt-verify-sheet';
import type { Question } from '../../../convex/lib/receipt/types';

const mockTrigger = vi.fn();
vi.mock('@/hooks/use-haptic', () => ({
  useHaptic: () => ({
    trigger: mockTrigger,
  }),
}));

describe('ReceiptVerifySheet component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const confirmQuestion: Question = {
    kind: 'confirm',
    field: 'total',
    prompt: 'Confirm total: 150.00',
    value: '150.00',
  };

  const textEntryQuestion: Question = {
    kind: 'entry',
    field: 'merchant',
    prompt: 'Enter merchant name',
    inputType: 'text',
  };

  test('does not render when isOpen is false', () => {
    render(
      <ReceiptVerifySheet
        isOpen={false}
        questions={[confirmQuestion]}
        onAnswer={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('does not render when questions array is empty', () => {
    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={[]}
        onAnswer={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders confirm question, calls onAnswer with selection haptic, and advances to next question', () => {
    const onAnswer = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={[confirmQuestion, textEntryQuestion]}
        onAnswer={onAnswer}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm total: 150.00')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    expect(mockTrigger).toHaveBeenCalledWith('selection');
    expect(onAnswer).toHaveBeenCalledWith({ total: '150.00' });
    expect(onClose).not.toHaveBeenCalled();

    // Advances to question 2
    expect(screen.getByText('Enter merchant name')).toBeInTheDocument();
  });

  test('renders text entry question, accepts input, calls onAnswer, and calls onClose after last question', () => {
    const onAnswer = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={[textEntryQuestion]}
        onAnswer={onAnswer}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Enter merchant name')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type value...');
    expect(input).toHaveClass('font-mono', 'tabular-nums', 'min-h-[48px]');

    fireEvent.change(input, { target: { value: 'Starbucks' } });
    expect(input).toHaveValue('Starbucks');

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);

    expect(mockTrigger).toHaveBeenCalledWith('selection');
    expect(onAnswer).toHaveBeenCalledWith({ merchant: 'Starbucks' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('cancel button on confirm question triggers light haptic and calls onClose', () => {
    const onAnswer = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={[confirmQuestion]}
        onAnswer={onAnswer}
        onClose={onClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockTrigger).toHaveBeenCalledWith('light');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  test('skip button on entry question triggers light haptic and calls onClose', () => {
    const onAnswer = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={[textEntryQuestion]}
        onAnswer={onAnswer}
        onClose={onClose}
      />
    );

    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);

    expect(mockTrigger).toHaveBeenCalledWith('light');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
