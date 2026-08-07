import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ReceiptVerifySheet } from './receipt-verify-sheet';
import type { Question } from '../../../convex/lib/receipt/types';

describe('Receipt verification bottom sheet component', () => {
  const questions: Question[] = [
    {
      kind: 'confirm',
      field: 'total',
      prompt: 'Confirm total: 150.00',
      value: '150.00',
    },
  ];

  test('renders current question and handles submit action', () => {
    const onAnswer = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptVerifySheet
        isOpen={true}
        questions={questions}
        onAnswer={onAnswer}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/Confirm total/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /confirm/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    expect(onAnswer).toHaveBeenCalledWith({ total: '150.00' });
  });
});
